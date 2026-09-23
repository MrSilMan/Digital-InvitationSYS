/**
 * Redaction of sensitive data before it leaves the process (logs, Sentry).
 *
 * Shared by the Winston logger (Node.js) and the Sentry SDK (server, edge and browser), so it uses
 * standard JavaScript only. Two layers:
 *  - by key: values under sensitive keys (passwords, tokens, cookies, phones, IBANs, guest names)
 *    are replaced or masked, whatever their content;
 *  - by pattern: every string is scanned for guest-token URLs, sensitive query parameters,
 *    bearer tokens, JWTs, e-mail addresses, IBANs and phone numbers.
 */

export const REDACTED = '[REDACTED]';

// ── Sensitive keys ───────────────────────────────────────────────────────────
const SECRET_KEY =
  /passw(?:or)?d|passphrase|pwd|secret|token|authori[sz]ation|cookie|session|api[-_]?key|private[-_]?key|credential|signature|csrf|jwt/i;
const PHONE_KEY = /phone|telefone|telem[oó]vel|whats[-_]?app|mobile|msisdn/i;
const IBAN_KEY = /iban/i;
const PERSON_NAME_KEY = /^(?:display|guest|full|first|last|companion)[-_]?names?$/i;

// ── Sensitive patterns inside strings ────────────────────────────────────────
/** `/c/<eventSlug>/<guestToken>`: keeps the first 4 token characters for support correlation. */
const GUEST_TOKEN_URL = /(\/c\/[A-Za-z0-9_-]+\/)([A-Za-z0-9_-]{4})[A-Za-z0-9_-]{12,}/g;
/** `token=…`, `access_token=…`, `X-Amz-Signature=…` (presigned URLs), `code=…`, `api_key=…`, … */
const SENSITIVE_QUERY_PARAM =
  /(^|[?&;])([^=&#\s?;]*(?:token|passw(?:or)?d|secret|signature|credential|code|api[-_]?key|session)[^=&#\s]*=)[^&#\s]*/gim;
const AUTH_SCHEME = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;
const EMAIL =
  /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g;
/** IBAN, e.g. `AO06 0044 0000 0123 4567 8910 1` (Angola: 25 characters). */
const IBAN = /\b([A-Z]{2}\d{2})((?:[ -]?[A-Z0-9]){11,30})\b/g;
/** Angolan mobile with country code: +244 9XX XXX XXX / 00244… */
const PHONE_AO_INTL = /(?:\+|\b00)244[\s.-]?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;
/** Any other number written in international format: +351 912 345 678, +1 555 123 4567, … */
const PHONE_INTL = /\+\d{1,3}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4}){2,4}\b/g;
/** Angolan mobile without country code: 9XX XXX XXX */
const PHONE_AO_LOCAL = /\b9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_STRING_LENGTH = 8_192;
const DEFAULT_MAX_ARRAY_ITEMS = 100;

export interface RedactOptions {
  /** Nesting depth after which values are replaced by `[Truncated]`. */
  maxDepth?: number;
  /** Longer strings are cut (protects logs and regex cost). */
  maxStringLength?: number;
  /** Longer arrays are cut, with a `[n more]` marker. */
  maxArrayItems?: number;
}

/** Masks a phone number, keeping only its last 3 digits: `***789`. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 3 ? `***${digits.slice(-3)}` : REDACTED;
}

/** Masks an IBAN, keeping the country/check digits and the last 4 characters: `AO06****8901`. */
export function maskIban(value: string): string {
  const compact = value.replace(/[\s-]/g, '');
  return compact.length > 8 ? `${compact.slice(0, 4)}****${compact.slice(-4)}` : REDACTED;
}

/** Applies every string pattern. Idempotent: redacting twice gives the same result. */
export function redactString(input: string, maxLength = DEFAULT_MAX_STRING_LENGTH): string {
  let s = input.length > maxLength ? `${input.slice(0, maxLength)}…[truncated]` : input;
  if (s.length < 6) return s; // shorter than the shortest pattern (`a@b.co`)
  s = s.replace(GUEST_TOKEN_URL, '$1$2****');
  s = s.replace(SENSITIVE_QUERY_PARAM, `$1$2${REDACTED}`);
  s = s.replace(AUTH_SCHEME, `$1 ${REDACTED}`);
  s = s.replace(JWT, '[REDACTED_JWT]');
  s = s.replace(EMAIL, '$1***@$2');
  s = s.replace(IBAN, (match) => maskIban(match));
  s = s.replace(PHONE_AO_INTL, (match) => maskPhone(match));
  s = s.replace(PHONE_INTL, (match) => maskPhone(match));
  s = s.replace(PHONE_AO_LOCAL, (match) => maskPhone(match));
  return s;
}

/** Key-based rule, if any, for a value stored under `key`. */
function redactByKey(key: string, value: unknown): { hit: true; value: unknown } | { hit: false } {
  if (value === null || value === undefined || value === '') return { hit: false };
  if (SECRET_KEY.test(key) || PERSON_NAME_KEY.test(key)) return { hit: true, value: REDACTED };
  if (PHONE_KEY.test(key)) {
    return { hit: true, value: typeof value === 'string' ? maskPhone(value) : REDACTED };
  }
  if (IBAN_KEY.test(key)) {
    return { hit: true, value: typeof value === 'string' ? maskIban(value) : REDACTED };
  }
  return { hit: false };
}

interface WalkState {
  seen: WeakSet<object>;
  maxDepth: number;
  maxStringLength: number;
  maxArrayItems: number;
}

function walkEntry(key: string, value: unknown, depth: number, state: WalkState): unknown {
  const byKey = redactByKey(key, value);
  return byKey.hit ? byKey.value : walk(value, depth, state);
}

function serializeError(error: Error, depth: number, state: WalkState): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: error.name,
    message: redactString(error.message, state.maxStringLength),
  };
  if (error.stack) out.stack = redactString(error.stack, state.maxStringLength);
  for (const key of Object.keys(error)) {
    out[key] = walkEntry(key, (error as unknown as Record<string, unknown>)[key], depth + 1, state);
  }
  if (error.cause !== undefined) out.cause = walk(error.cause, depth + 1, state);
  return out;
}

function walk(value: unknown, depth: number, state: WalkState): unknown {
  switch (typeof value) {
    case 'string':
      return redactString(value, state.maxStringLength);
    case 'number':
    case 'boolean':
    case 'undefined':
      return value;
    case 'bigint':
      return value.toString();
    case 'symbol':
      return value.toString();
    case 'function':
      return `[Function ${value.name || 'anonymous'}]`;
  }
  if (value === null) return null;

  const obj = value as object;
  if (state.seen.has(obj)) return '[Circular]';
  if (depth >= state.maxDepth) return '[Truncated]';

  if (obj instanceof Date) return Number.isNaN(obj.getTime()) ? 'Invalid Date' : obj.toISOString();
  if (obj instanceof URL) return redactString(obj.toString(), state.maxStringLength);
  if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) {
    return `[Binary ${obj.byteLength} bytes]`;
  }

  state.seen.add(obj);
  try {
    if (obj instanceof Error) return serializeError(obj, depth, state);
    if (Array.isArray(obj)) {
      const limit = state.maxArrayItems;
      const items = obj.slice(0, limit).map((item) => walk(item, depth + 1, state));
      if (obj.length > limit) items.push(`[${obj.length - limit} more]`);
      return items;
    }
    if (obj instanceof Map) {
      const out: Record<string, unknown> = {};
      for (const [key, item] of obj)
        out[String(key)] = walkEntry(String(key), item, depth + 1, state);
      return out;
    }
    if (obj instanceof Set) return walk(Array.from(obj), depth, state);

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      out[key] = walkEntry(key, (obj as Record<string, unknown>)[key], depth + 1, state);
    }
    return out;
  } finally {
    state.seen.delete(obj);
  }
}

function createState(options?: RedactOptions): WalkState {
  return {
    seen: new WeakSet(),
    maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH,
    maxStringLength: options?.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
    maxArrayItems: options?.maxArrayItems ?? DEFAULT_MAX_ARRAY_ITEMS,
  };
}

/** Deep-copies `value` with every sensitive key and pattern redacted. Never mutates the input. */
export function redact<T>(value: T, options?: RedactOptions): T {
  return walk(value, 0, createState(options)) as T;
}

/** Like `redact`, but also applies the key rule to a top-level `key` (e.g. a log metadata field). */
export function redactEntry(key: string, value: unknown, options?: RedactOptions): unknown {
  return walkEntry(key, value, 0, createState(options));
}
