import 'server-only';

import type { JobsOptions, Queue } from 'bullmq';

import { addJob, producerQueue, requeueJob } from './producer';

/**
 * The "guests" job queue, processed by the worker next to the media queue (so a CSV import never
 * waits behind image processing):
 * - `import-guests`: read an uploaded CSV file and add its guests (src/server/guests/import.ts);
 * - `sweep-imports`: scheduled by the worker, catches imports whose job was lost.
 */

export const GUEST_QUEUE = 'guests';

export interface GuestJobData {
  'import-guests': { importId: string };
  'sweep-imports': Record<string, never>;
}

/** Imports are quick: a few retries, soon (5 s, 10 s). */
export const GUEST_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
} as const satisfies JobsOptions;

/** One job per import: queueing it twice (upload, then the sweep) is a no-op. */
export const importJobId = (importId: string) => `import-${importId}`;

const QUEUE_KEY = Symbol.for('convites.guestQueue');

export function getGuestQueue(): Queue {
  return producerQueue(GUEST_QUEUE, QUEUE_KEY, GUEST_JOB_OPTIONS);
}

/** Queues an import; false when Redis is unavailable (the caller then runs it at once). */
export function enqueueGuestImport(importId: string): Promise<boolean> {
  const data: GuestJobData['import-guests'] = { importId };
  return addJob(getGuestQueue, 'import-guests', data, { jobId: importJobId(importId) });
}

/** For the sweep (worker): queues the import again, unless its job is still waiting or running. */
export function requeueGuestImport(importId: string): Promise<void> {
  return requeueJob(getGuestQueue(), 'import-guests', { importId }, importJobId(importId));
}
