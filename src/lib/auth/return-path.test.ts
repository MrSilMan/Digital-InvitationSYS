import { describe, expect, it } from 'vitest';

import { isSignedInArea } from './cookies';
import {
  DEFAULT_RETURN_PATH,
  defaultReturnPath,
  parseReturnPath,
  safeReturnPath,
} from './return-path';

describe('safeReturnPath', () => {
  it('keeps paths inside the signed-in areas', () => {
    expect(safeReturnPath('/painel')).toBe('/painel');
    expect(safeReturnPath('/painel/eventos/abc?separador=geral')).toBe(
      '/painel/eventos/abc?separador=geral',
    );
    expect(safeReturnPath('/admin')).toBe('/admin');
  });

  it.each([
    ['another site', 'https://evil.example/painel'],
    ['a protocol-relative URL', '//evil.example/painel'],
    ['a backslash trick', '/\\evil.example'],
    ['a guest page', '/c/braulio-e-nanda/token'],
    ['a look-alike path', '/painelx'],
    ['a path that climbs out', '/painel/../c/x'],
    ['nothing', undefined],
    ['a list', ['/painel']],
  ])('falls back to the dashboard for %s', (_, value) => {
    expect(safeReturnPath(value)).toBe(DEFAULT_RETURN_PATH);
    expect(parseReturnPath(value)).toBeNull();
  });
});

describe('defaultReturnPath', () => {
  it('sends admins to the admin area and couples to their dashboard', () => {
    expect(defaultReturnPath('admin')).toBe('/admin');
    expect(defaultReturnPath('couple')).toBe('/painel');
  });
});

describe('isSignedInArea', () => {
  it('covers the dashboard, the preview and the admin area only', () => {
    expect(isSignedInArea('/painel')).toBe(true);
    expect(isSignedInArea('/painel/eventos/x')).toBe(true);
    expect(isSignedInArea('/previsualizar/x')).toBe(true);
    expect(isSignedInArea('/admin')).toBe(true);
    expect(isSignedInArea('/entrar')).toBe(false);
    expect(isSignedInArea('/c/slug/token')).toBe(false);
    expect(isSignedInArea('/painelx')).toBe(false);
  });
});
