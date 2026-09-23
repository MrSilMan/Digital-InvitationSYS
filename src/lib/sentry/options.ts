import type { Breadcrumb, DataCollection, ErrorEvent, StreamedSpanJSON } from '@sentry/core';

import { redact, type RedactOptions, redactString } from '@/lib/redact';

/**
 * Privacy settings shared by the server, edge and browser Sentry SDKs.
 *
 * Sentry v11 collects user info, cookies, headers, bodies, query strings and local variables when
 * `dataCollection` is left unset, so every category is set explicitly here. Guest names, phone
 * numbers, IBANs and tokens must never reach Sentry.
 */
export const SENTRY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { allow: ['accept', 'accept-language', 'content-type', 'user-agent', 'x-request-id'] },
    response: { allow: ['content-type', 'x-request-id'] },
  },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  // Local variables can hold guest data; source names are also lost after minification.
  stackFrameVariables: false,
};

// Sentry events nest deeply (exception.values[].stacktrace.frames[]…): allow more depth, never cut arrays.
const EVENT_REDACTION: RedactOptions = { maxDepth: 16, maxArrayItems: Number.POSITIVE_INFINITY };

/** `beforeSend`: redacts the whole event (URLs, messages, extra, contexts, breadcrumbs, tags). */
export function scrubEvent<T extends ErrorEvent>(event: T): T {
  // SDK-internal metadata is never sent and may hold live request objects: leave it untouched.
  const { sdkProcessingMetadata, ...rest } = event;
  const scrubbed = redact(rest, EVENT_REDACTION) as T;
  if (sdkProcessingMetadata !== undefined) scrubbed.sdkProcessingMetadata = sdkProcessingMetadata;
  return scrubbed;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return redact(breadcrumb, EVENT_REDACTION);
}

/** `beforeSendSpan` (span streaming, the v11 default): span names and attributes may carry URLs. */
export function scrubSpan(span: StreamedSpanJSON): StreamedSpanJSON {
  return {
    ...span,
    name: redactString(span.name),
    attributes: redact(span.attributes, EVENT_REDACTION),
  };
}
