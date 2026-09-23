import type { ErrorEvent, StreamedSpanJSON } from '@sentry/core';
import { describe, expect, it } from 'vitest';

import {
  SENTRY_DATA_COLLECTION,
  scrubBreadcrumb,
  scrubEvent,
  scrubSpan,
} from '@/lib/sentry/options';

describe('Sentry privacy', () => {
  it('turns off every personal-data collection category', () => {
    expect(SENTRY_DATA_COLLECTION).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    });
  });

  it('scrubs guest tokens, phones, IBANs and guest names from events', () => {
    const metadata = { normalizedRequest: { url: 'kept as is' } };
    const event = {
      event_id: 'e1',
      type: undefined,
      message: 'Falha ao notificar +244 923 456 789',
      request: {
        url: 'https://convites.ao/c/ev/AbCdEfGhIjKlMnOp',
        headers: { cookie: 'session=abc', 'user-agent': 'Mozilla/5.0' },
      },
      extra: { guestName: 'Família Silva', iban: 'AO06004400000123456789101' },
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: '/c/ev/AbCdEfGhIjKlMnOp', to: '/c/ev/AbCdEfGhIjKlMnOp#rsvp' },
        },
      ],
      tags: { request_id: '5f0c7a2e-4b1d-4c7e-9a3f-2d8e1b6c9f00' },
      sdkProcessingMetadata: metadata,
    } as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.message).toBe('Falha ao notificar ***789');
    expect(scrubbed.request?.url).toBe('https://convites.ao/c/ev/AbCd****');
    expect(scrubbed.request?.headers).toEqual({
      cookie: '[REDACTED]',
      'user-agent': 'Mozilla/5.0',
    });
    expect(scrubbed.extra).toEqual({ guestName: '[REDACTED]', iban: 'AO06****9101' });
    expect(scrubbed.breadcrumbs?.[0]?.data).toEqual({
      from: '/c/ev/AbCd****',
      to: '/c/ev/AbCd****#rsvp',
    });
    expect(scrubbed.tags).toEqual({ request_id: '5f0c7a2e-4b1d-4c7e-9a3f-2d8e1b6c9f00' });
    expect(scrubbed.sdkProcessingMetadata).toBe(metadata);
    // The original event is left untouched.
    expect(event.request?.url).toBe('https://convites.ao/c/ev/AbCdEfGhIjKlMnOp');
  });

  it('scrubs breadcrumbs as they are recorded', () => {
    expect(
      scrubBreadcrumb({ category: 'fetch', data: { url: '/api/rsvp?token=AbCdEf123' } }),
    ).toEqual({ category: 'fetch', data: { url: '/api/rsvp?token=[REDACTED]' } });
  });

  it('scrubs span names and attributes', () => {
    const span = {
      trace_id: 't',
      span_id: 's',
      name: 'GET /c/ev/AbCdEfGhIjKlMnOp',
      start_timestamp: 1,
      end_timestamp: 2,
      status: 'ok',
      is_segment: true,
      attributes: {
        'url.full': 'https://convites.ao/c/ev/AbCdEfGhIjKlMnOp?token=abc',
        'http.request.header.authorization': 'Bearer abcdefghijk',
        'http.response.status_code': 200,
      },
    } as unknown as StreamedSpanJSON;

    const scrubbed = scrubSpan(span);

    expect(scrubbed.name).toBe('GET /c/ev/AbCd****');
    expect(scrubbed.attributes).toEqual({
      'url.full': 'https://convites.ao/c/ev/AbCd****?token=[REDACTED]',
      'http.request.header.authorization': '[REDACTED]',
      'http.response.status_code': 200,
    });
  });
});
