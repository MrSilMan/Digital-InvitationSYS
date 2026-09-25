import type { ServerEnv } from '@/env';

type StorageEnv = Pick<
  ServerEnv,
  'S3_ENDPOINT' | 'S3_PUBLIC_ENDPOINT' | 'S3_REGION' | 'S3_BUCKET' | 'S3_FORCE_PATH_STYLE'
>;

/**
 * The origin browsers upload to with presigned URLs, for the dashboard's Content-Security-Policy
 * (`connect-src`). Mirrors the AWS SDK: path-style URLs keep the endpoint's host (MinIO);
 * otherwise the bucket is a subdomain (R2, AWS S3; bucket names without dots).
 */
export function uploadOrigin(env: StorageEnv): string {
  const url = new URL(
    env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT ?? `https://s3.${env.S3_REGION}.amazonaws.com`,
  );
  if (!env.S3_FORCE_PATH_STYLE) url.hostname = `${env.S3_BUCKET}.${url.hostname}`;
  return url.origin;
}
