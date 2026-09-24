import 'server-only';

import { inspect } from 'node:util';

import winston from 'winston';
import TransportStream from 'winston-transport';

import { getErrorReporter, isErrorAlreadyReported } from '@/lib/error-reporter';
import { redactEntry, redactString } from '@/lib/redact';
import { getRequestContext } from '@/lib/request-context';

/**
 * Application logger (Node.js runtime only: Server Components, Server Actions, Route Handlers,
 * instrumentation and the worker — never Edge code or Client Components).
 *
 * - JSON lines on stdout in production, readable colorized lines in development.
 * - Every line carries timestamp, level, service, env, release and the current request ID.
 * - Sensitive data is redacted automatically (see `src/lib/redact.ts`).
 * - `error` logs are forwarded to the registered error reporter (Sentry), unless Sentry already
 *   captured that error.
 *
 * Convention: pass errors as `logger.error('What failed', { err })`.
 */

export const LOG_LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 } as const;
export type LogLevel = keyof typeof LOG_LEVELS;
export type Logger = winston.Logger;

// `triple-beam` symbol that holds the raw (uncolorized) level.
const LEVEL = Symbol.for('level');
// The logged Error object, kept for the error reporter after the fields are serialized.
const ORIGINAL_ERROR = Symbol.for('convites.log.originalError');

type Info = winston.Logform.TransformableInfo & Record<string | symbol, unknown>;

/** Fields added by the logger itself: never redacted. */
const TRUSTED_FIELDS = new Set([
  'level',
  'timestamp',
  'service',
  'env',
  'release',
  'requestId',
  'userId',
]);

function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && Object.hasOwn(LOG_LEVELS, value);
}

/** Supports `logger.error(err)` as well as `logger.error('msg', { err })` / `{ error }`. */
const normalizeErrors = winston.format((info) => {
  if (info instanceof Error) {
    const normalized: Info = { ...(info as Info), message: info.message, err: info };
    normalized[ORIGINAL_ERROR] = info;
    return normalized;
  }
  const candidate = [info.err, info.error, info.message].find((value) => value instanceof Error);
  if (candidate) {
    (info as Info)[ORIGINAL_ERROR] = candidate;
    if (info.message === candidate) {
      info.message = (candidate as Error).message;
      info.err ??= candidate;
    }
  }
  return info;
});

const addRequestContext = winston.format((info) => {
  const context = getRequestContext();
  if (info.requestId === undefined && context?.requestId) info.requestId = context.requestId;
  if (info.userId === undefined && context?.userId) info.userId = context.userId;
  return info;
});

const redactFields = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (TRUSTED_FIELDS.has(key)) continue;
    const value = info[key];
    info[key] =
      key === 'message' && typeof value === 'string'
        ? redactString(value)
        : redactEntry(key, value);
  }
  return info;
});

const PRETTY_OMITTED = new Set([
  'level',
  'message',
  'timestamp',
  'service',
  'env',
  'release',
  'requestId',
  'stack',
]);

const prettyLine = winston.format.printf((info) => {
  const meta: Record<string, unknown> = {};
  for (const key of Object.keys(info)) {
    if (!PRETTY_OMITTED.has(key)) meta[key] = info[key];
  }
  let stack = typeof info.stack === 'string' ? info.stack : undefined;
  const err = meta.err as { stack?: unknown } | undefined;
  if (err && typeof err === 'object' && typeof err.stack === 'string') {
    stack ??= err.stack;
    meta.err = { ...err, stack: undefined };
  }
  const requestId = typeof info.requestId === 'string' ? ` [${info.requestId.slice(0, 8)}]` : '';
  const details = Object.keys(meta).length
    ? ` ${inspect(meta, { colors: true, depth: 5, breakLength: 140, compact: 3 })}`
    : '';
  return `${String(info.timestamp)} ${info.level}${requestId} ${String(info.message)}${details}${stack ? `\n${stack}` : ''}`;
});

/** Forwards `error` logs to the registered reporter (Sentry). Logging must never throw. */
export class ErrorReporterTransport extends TransportStream {
  override log(info: Info, next: () => void): void {
    try {
      const report = getErrorReporter();
      const original = info[ORIGINAL_ERROR];
      if (report && info[LEVEL] === 'error' && !isErrorAlreadyReported(original)) {
        const context: Record<string, unknown> = {};
        for (const key of Object.keys(info)) {
          if (key !== 'level' && key !== 'timestamp' && key !== 'err') context[key] = info[key];
        }
        let error: Error;
        if (original instanceof Error) {
          error = original;
        } else {
          error = new Error(String(info.message));
          if (typeof info.stack === 'string') error.stack = info.stack;
        }
        report(error, context);
      }
    } catch {
      // Never let error reporting break the request that logged the error.
    }
    next();
  }
}

export interface CreateLoggerOptions {
  level?: LogLevel;
  service?: string;
  env?: string;
  release?: string;
  /** Colorized single-line output (development). Defaults to NODE_ENV === 'development'. */
  pretty?: boolean;
  /** Replaces the default stdout + error-reporter transports (tests). */
  transports?: TransportStream[];
}

function defaultLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL;
  if (isLogLevel(fromEnv)) return fromEnv;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

winston.addColors({ error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' });

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const pretty = options.pretty ?? process.env.NODE_ENV === 'development';
  const output = pretty
    ? [
        winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
        winston.format.colorize({ level: true }),
        prettyLine,
      ]
    : [winston.format.timestamp(), winston.format.json()];

  return winston.createLogger({
    levels: LOG_LEVELS,
    level: options.level ?? defaultLevel(),
    defaultMeta: {
      service: options.service ?? process.env.SERVICE_NAME ?? 'web',
      env: options.env ?? process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
      release: options.release ?? process.env.APP_RELEASE ?? 'dev',
    },
    format: winston.format.combine(
      normalizeErrors(),
      addRequestContext(),
      redactFields(),
      ...output,
    ),
    transports: options.transports ?? [
      new winston.transports.Console(),
      new ErrorReporterTransport({ level: 'error' }),
    ],
    exitOnError: false,
  });
}

// One logger per process, shared by every server bundle (see request-context.ts for why).
const LOGGER_KEY = Symbol.for('convites.logger');
type GlobalWithLogger = typeof globalThis & { [LOGGER_KEY]?: Logger };
const g = globalThis as GlobalWithLogger;

export const logger: Logger = (g[LOGGER_KEY] ??= createLogger());
