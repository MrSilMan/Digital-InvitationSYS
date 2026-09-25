import 'server-only';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getServerEnv } from '@/env';
import { isDeletablePrefix } from '@/lib/media/keys';

/**
 * Object storage over the S3 API: MinIO locally, Cloudflare R2 or AWS S3 in production. The bucket
 * is private: browsers upload with short-lived presigned URLs, and pages get media through the
 * app (/m/…). Used by the web app and the worker.
 */

const CLIENT_KEY = Symbol.for('convites.s3');
const PRESIGN_KEY = Symbol.for('convites.s3.presign');
type GlobalWithS3 = typeof globalThis & { [CLIENT_KEY]?: S3Client; [PRESIGN_KEY]?: S3Client };

function createClient(endpoint: string | undefined): S3Client {
  const env = getServerEnv();
  return new S3Client({
    endpoint,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    // Only send checksums the operation requires (R2 and MinIO reject some of the defaults).
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** The client for the app's and the worker's own requests. */
export function getS3(): S3Client {
  const g = globalThis as GlobalWithS3;
  g[CLIENT_KEY] ??= createClient(getServerEnv().S3_ENDPOINT);
  return g[CLIENT_KEY];
}

/** The client that signs upload URLs for browsers (the host is part of the signature). */
function getPresignS3(): S3Client {
  const env = getServerEnv();
  if (!env.S3_PUBLIC_ENDPOINT) return getS3();
  const g = globalThis as GlobalWithS3;
  g[PRESIGN_KEY] ??= createClient(env.S3_PUBLIC_ENDPOINT);
  return g[PRESIGN_KEY];
}

const bucket = () => getServerEnv().S3_BUCKET;

export interface PresignedUpload {
  url: string;
  /** Headers the browser must send exactly (they are signed). */
  headers: Record<string, string>;
}

/**
 * A PUT URL valid for `expiresIn` seconds. The content type and the exact size are signed, so the
 * browser cannot upload another kind of file or a bigger one with it.
 */
export async function presignUpload(input: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}): Promise<PresignedUpload> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(getPresignS3(), command, {
    expiresIn: input.expiresIn ?? 300,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
  return { url, headers: { 'Content-Type': input.contentType } };
}

function isMissing(err: unknown): boolean {
  return (
    err instanceof NotFound ||
    err instanceof NoSuchKey ||
    (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404)
  );
}

/** Size and type of a stored object, or null when there is none. */
export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string | null } | null> {
  try {
    const head = await getS3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? null };
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

/** A whole object in memory (uploads are a few MB at most); refuses anything over `maxBytes`. */
export async function getObjectBuffer(key: string, maxBytes: number): Promise<Buffer | null> {
  try {
    const object = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if ((object.ContentLength ?? 0) > maxBytes) throw new Error(`Object too large: ${key}`);
    const bytes = await object.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

export interface StoredObjectStream {
  body: ReadableStream;
  contentLength: number | undefined;
  contentRange: string | undefined;
  etag: string | undefined;
  partial: boolean;
}

/**
 * An object as a web stream, optionally one byte range (audio seeking). Null when missing,
 * 'invalid-range' when the range starts past the end.
 */
export async function getObjectStream(
  key: string,
  range?: string,
): Promise<StoredObjectStream | 'invalid-range' | null> {
  try {
    const object = await getS3().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key, Range: range }),
    );
    if (!object.Body) return null;
    return {
      body: object.Body.transformToWebStream(),
      contentLength: object.ContentLength,
      contentRange: object.ContentRange,
      etag: object.ETag,
      partial: Boolean(object.ContentRange),
    };
  } catch (err) {
    if (isMissing(err)) return null;
    if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 416) {
      return 'invalid-range';
    }
    throw err;
  }
}

/** Stores a processed file, cached for a year by browsers (its key never gets other content). */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

/** Deletes objects (missing ones are fine). */
export async function deleteObjects(keys: readonly string[]): Promise<void> {
  for (let start = 0; start < keys.length; start += 1000) {
    const batch = keys.slice(start, start + 1000);
    if (batch.length === 0) continue;
    const result = await getS3().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const failed = result.Errors?.filter((error) => error.Code !== 'NoSuchKey') ?? [];
    if (failed.length > 0) {
      throw new Error(`Could not delete ${failed.length} object(s): ${failed[0]?.Code ?? ''}`);
    }
  }
}

/**
 * Deletes every object in a folder (`media/<event>/<media>/`), including files a failed run left
 * behind. Refuses anything broader than one ID below `media/` or `originals/`.
 */
export async function deletePrefix(prefix: string): Promise<number> {
  if (!isDeletablePrefix(prefix)) throw new Error(`Refusing to delete prefix "${prefix}"`);
  let deleted = 0;
  let token: string | undefined;
  do {
    const page = await getS3().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (page.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : []));
    await deleteObjects(keys);
    deleted += keys.length;
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}
