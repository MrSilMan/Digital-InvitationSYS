import { afterEach, describe, expect, it, vi } from 'vitest';
import TransportStream from 'winston-transport';

import { setErrorReporter } from '@/lib/error-reporter';
import { createLogger, ErrorReporterTransport, type LogLevel } from '@/lib/logger';
import { runWithRequestContext } from '@/lib/request-context';

const MESSAGE = Symbol.for('message');

type Line = Record<string, unknown>;

/** Collects the final JSON lines exactly as they would be written to stdout. */
class MemoryTransport extends TransportStream {
  readonly lines: Line[] = [];

  override log(info: Record<string | symbol, unknown>, next: () => void): void {
    this.lines.push(JSON.parse(String(info[MESSAGE])) as Line);
    next();
  }
}

function setup(level: LogLevel = 'debug') {
  const memory = new MemoryTransport();
  const logger = createLogger({
    level,
    service: 'web',
    env: 'test',
    release: 'abc1234',
    pretty: false,
    transports: [memory, new ErrorReporterTransport({ level: 'error' })],
  });
  return { logger, lines: memory.lines };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

afterEach(() => {
  setErrorReporter(undefined);
});

describe('logger', () => {
  it('writes JSON lines with service, env, release and the request ID from context', async () => {
    const { logger, lines } = setup();

    runWithRequestContext({ requestId: 'req-abc-123456' }, () => {
      logger.info('hello', { route: '/x' });
    });
    await flush();

    expect(lines[0]).toMatchObject({
      level: 'info',
      message: 'hello',
      service: 'web',
      env: 'test',
      release: 'abc1234',
      requestId: 'req-abc-123456',
      route: '/x',
      timestamp: expect.any(String),
    });
  });

  it('omits the request ID outside a request', async () => {
    const { logger, lines } = setup();
    logger.info('startup');
    await flush();
    expect(lines[0]).not.toHaveProperty('requestId');
  });

  it('redacts sensitive data in the message and the metadata', async () => {
    const { logger, lines } = setup();

    logger.info('convite aberto em /c/ev/AbCdEfGhIjKlMnOp por +244 923 456 789', {
      password: 'hunter2',
      guest: { phone: '923456789', iban: 'AO06004400000123456789101' },
    });
    await flush();

    expect(lines[0]).toMatchObject({
      message: 'convite aberto em /c/ev/AbCd**** por ***789',
      password: '[REDACTED]',
      guest: { phone: '***789', iban: 'AO06****9101' },
    });
  });

  it('respects the configured level', async () => {
    const { logger, lines } = setup('warn');
    logger.info('ignored');
    logger.debug('ignored');
    logger.warn('kept');
    await flush();
    expect(lines.map((line) => line.message)).toEqual(['kept']);
  });

  it('serializes errors with their stack', async () => {
    const { logger, lines } = setup();
    logger.warn('upload failed', { err: new Error('boom') });
    logger.warn(new Error('direct'));
    await flush();

    expect(lines[0]).toMatchObject({
      message: 'upload failed',
      err: { name: 'Error', message: 'boom' },
    });
    expect((lines[0]?.err as { stack: string }).stack).toContain('boom');
    expect(lines[1]).toMatchObject({ message: 'direct', err: { message: 'direct' } });
  });
});

describe('logger → error reporter (Sentry)', () => {
  it('forwards error logs with the original error object and redacted context', async () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const { logger } = setup();
    const err = new Error('boom');

    runWithRequestContext({ requestId: 'req-xyz-123456' }, () => {
      logger.error('payment failed', { err, iban: 'AO06004400000123456789101' });
    });
    await flush();

    expect(reporter).toHaveBeenCalledTimes(1);
    const [reported, context] = reporter.mock.calls[0] as [Error, Record<string, unknown>];
    expect(reported).toBe(err);
    expect(context).toMatchObject({
      message: 'payment failed',
      requestId: 'req-xyz-123456',
      iban: 'AO06****9101',
    });
  });

  it('reports message-only error logs as a new Error', async () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const { logger } = setup();

    logger.error('queue unavailable');
    await flush();

    const [reported] = reporter.mock.calls[0] as [Error];
    expect(reported).toBeInstanceOf(Error);
    expect(reported.message).toBe('queue unavailable');
  });

  it('skips errors Sentry already captured, and non-error levels', async () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const { logger } = setup();
    const captured = new Error('already sent');
    Object.defineProperty(captured, '__sentry_captured__', { value: true });

    logger.error('request failed', { err: captured });
    logger.warn('just a warning', { err: new Error('warn') });
    await flush();

    expect(reporter).not.toHaveBeenCalled();
  });

  it('never throws when the reporter fails', async () => {
    setErrorReporter(() => {
      throw new Error('sentry down');
    });
    const { logger, lines } = setup();

    expect(() => logger.error('still logged')).not.toThrow();
    await flush();
    expect(lines[0]).toMatchObject({ message: 'still logged' });
  });
});
