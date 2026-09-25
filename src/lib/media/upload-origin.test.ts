import { describe, expect, it } from 'vitest';

import { uploadOrigin } from './upload-origin';

const base = {
  S3_ENDPOINT: undefined,
  S3_PUBLIC_ENDPOINT: undefined,
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'convites-media',
  S3_FORCE_PATH_STYLE: false,
};

describe('upload origin (CSP connect-src)', () => {
  it('keeps the endpoint host for path-style storage (MinIO)', () => {
    expect(
      uploadOrigin({ ...base, S3_ENDPOINT: 'http://localhost:9000', S3_FORCE_PATH_STYLE: true }),
    ).toBe('http://localhost:9000');
  });

  it('uses the public endpoint when browsers reach storage elsewhere (Docker)', () => {
    expect(
      uploadOrigin({
        ...base,
        S3_ENDPOINT: 'http://minio:9000',
        S3_PUBLIC_ENDPOINT: 'http://localhost:9000',
        S3_FORCE_PATH_STYLE: true,
      }),
    ).toBe('http://localhost:9000');
  });

  it('puts the bucket in the host otherwise (Cloudflare R2, AWS S3)', () => {
    expect(uploadOrigin({ ...base, S3_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com' })).toBe(
      'https://convites-media.abc123.r2.cloudflarestorage.com',
    );
    expect(uploadOrigin({ ...base, S3_REGION: 'eu-west-1' })).toBe(
      'https://convites-media.s3.eu-west-1.amazonaws.com',
    );
  });
});
