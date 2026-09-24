import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context propagated with AsyncLocalStorage (Node.js runtime only).
 *
 * The context is opened for every incoming HTTP request by `installHttpRequestHooks()`
 * (see `src/lib/observability/http-hooks.ts`), so Server Components, Server Actions and
 * Route Handlers all see the same request ID without passing it around.
 * The worker opens one per job with `runWithRequestContext`.
 */
export interface RequestContext {
  requestId: string;
  /** The signed-in user (dashboard and admin requests), once the session has been read. */
  userId?: string;
}

// Next.js bundles instrumentation, proxy and route code separately, which can instantiate this module
// more than once. Keeping the storage on `globalThis` guarantees a single shared instance.
const STORAGE_KEY = Symbol.for('convites.requestContext');

type GlobalWithStorage = typeof globalThis & {
  [STORAGE_KEY]?: AsyncLocalStorage<RequestContext>;
};

function storage(): AsyncLocalStorage<RequestContext> {
  const g = globalThis as GlobalWithStorage;
  g[STORAGE_KEY] ??= new AsyncLocalStorage<RequestContext>();
  return g[STORAGE_KEY];
}

export function getRequestContext(): RequestContext | undefined {
  return storage().getStore();
}

export function getRequestId(): string | undefined {
  return storage().getStore()?.requestId;
}

/** Records the signed-in user for the rest of the request (log lines then carry `userId`). */
export function setRequestUser(userId: string): void {
  const context = storage().getStore();
  if (context) context.userId = userId;
}

/** Runs `fn` (and everything it awaits) inside the given context. */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage().run(context, fn);
}

/**
 * Enters the context for the rest of the current synchronous execution and every async operation
 * started from it. Only for hooks that cannot wrap the code that follows them (diagnostics channels).
 */
export function enterRequestContext(context: RequestContext): void {
  storage().enterWith(context);
}
