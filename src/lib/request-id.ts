/**
 * Request ID helpers. Runtime-agnostic (Node.js, Edge, browser): uses only the Web Crypto global.
 */

export const REQUEST_ID_HEADER = 'x-request-id';

/** Accepts IDs we generate (UUIDs) and well-formed upstream IDs (e.g. Caddy's `{http.request.uuid}`). */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value);
}

/**
 * Reuses a well-formed incoming ID so logs can be correlated with the reverse proxy;
 * anything missing or malformed (possible log injection) is replaced by a fresh ID.
 */
export function resolveRequestId(incoming: string | readonly string[] | null | undefined): string {
  const candidate = typeof incoming === 'string' ? incoming : incoming?.[0];
  return isValidRequestId(candidate) ? candidate : createRequestId();
}
