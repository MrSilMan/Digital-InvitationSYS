/* eslint-disable no-console -- this module wraps the console methods themselves */
import { format } from 'node:util';

import { redactString } from '@/lib/redact';

const INSTALLED_KEY = Symbol.for('convites.consoleRedaction');
const METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
const MAX_LENGTH = 32_768;

/**
 * Production safety net: Next.js and third-party libraries print some errors straight to the console
 * (outside Winston). Route that output through the same redaction so stdout never carries guest
 * tokens, phone numbers or IBANs. Winston writes to stdout directly and is not affected.
 */
export function installConsoleRedaction(): void {
  const g = globalThis as typeof globalThis & { [INSTALLED_KEY]?: boolean };
  if (g[INSTALLED_KEY]) return;
  g[INSTALLED_KEY] = true;

  for (const method of METHODS) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      original(redactString(format(...args), MAX_LENGTH));
    };
  }
}
