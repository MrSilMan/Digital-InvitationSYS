import { CreateBucketCommand, S3ServiceException } from '@aws-sdk/client-s3';

import { deletePrefix, getS3 } from '@/server/storage/s3';

/** Throws unless the bucket is a test bucket (its name ends in `-test`). */
export function assertTestBucket(bucket: string | undefined): string {
  if (!bucket?.endsWith('-test')) {
    throw new Error(`Refusing to use bucket "${bucket}" for tests: its name must end in -test.`);
  }
  return bucket;
}

/** Creates the test bucket in the local MinIO if needed. */
export async function ensureTestBucket(): Promise<void> {
  const bucket = assertTestBucket(process.env.S3_BUCKET);
  try {
    await getS3().send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (err) {
    const exists =
      err instanceof S3ServiceException &&
      (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists');
    if (!exists) throw err;
  }
}

/** Removes every stored file of an event (originals and processed files). */
export async function deleteEventFiles(eventId: string): Promise<void> {
  assertTestBucket(process.env.S3_BUCKET);
  await deletePrefix(`originals/${eventId}/`);
  await deletePrefix(`media/${eventId}/`);
}
