import { describe, expect, it } from 'vitest';

import {
  fileMimeType,
  isRetryableFailure,
  isSingleMediaType,
  normalizeMimeType,
  toMediaFailure,
  uploadProblem,
} from './rules';

const MB = 1024 * 1024;

describe('upload rules', () => {
  it('accepts photos up to their limit and MP3 music', () => {
    expect(uploadProblem('GALLERY', { mimeType: 'image/jpeg', size: 15 * MB })).toBeNull();
    expect(uploadProblem('HERO', { mimeType: 'image/png', size: 1 })).toBeNull();
    expect(uploadProblem('LOGO', { mimeType: 'image/webp', size: 5 * MB })).toBeNull();
    expect(uploadProblem('MUSIC', { mimeType: 'audio/mp3', size: 5 * MB })).toBeNull();
  });

  it('says why a file is refused', () => {
    expect(uploadProblem('GALLERY', { mimeType: 'image/heic', size: MB })).toBe('type');
    expect(uploadProblem('GALLERY', { mimeType: 'image/svg+xml', size: MB })).toBe('type');
    expect(uploadProblem('MUSIC', { mimeType: 'audio/wav', size: MB })).toBe('type');
    expect(uploadProblem('HERO', { mimeType: 'audio/mpeg', size: MB })).toBe('type');
    expect(uploadProblem('GALLERY', { mimeType: 'image/jpeg', size: 15 * MB + 1 })).toBe('size');
    expect(uploadProblem('LOGO', { mimeType: 'image/png', size: 5 * MB + 1 })).toBe('size');
    expect(uploadProblem('GALLERY', { mimeType: 'image/jpeg', size: 0 })).toBe('empty');
  });

  it('normalizes the MIME type names browsers use', () => {
    expect(normalizeMimeType(' IMAGE/JPG ')).toBe('image/jpeg');
    expect(normalizeMimeType('image/pjpeg')).toBe('image/jpeg');
    expect(normalizeMimeType('audio/mpeg3')).toBe('audio/mpeg');
  });

  it('falls back to the extension when the phone reports no type', () => {
    expect(fileMimeType({ type: '', name: 'Casamento.MP3' })).toBe('audio/mpeg');
    expect(fileMimeType({ type: '', name: 'foto.jpeg' })).toBe('image/jpeg');
    expect(fileMimeType({ type: '', name: 'sem-extensao' })).toBe('');
    expect(fileMimeType({ type: 'image/jpg', name: 'x.png' })).toBe('image/jpeg');
  });

  it('keeps one hero, logo and song per event, and up to 12 photos', () => {
    expect(isSingleMediaType('HERO')).toBe(true);
    expect(isSingleMediaType('LOGO')).toBe(true);
    expect(isSingleMediaType('MUSIC')).toBe(true);
    expect(isSingleMediaType('GALLERY')).toBe(false);
  });

  it('reads stored failure reasons; only our own failures are worth a retry', () => {
    expect(toMediaFailure(null)).toBeNull();
    expect(toMediaFailure('not-mp3')).toBe('not-mp3');
    expect(toMediaFailure('something old')).toBe('error');
    expect(isRetryableFailure('error')).toBe(true);
    expect(isRetryableFailure('unreadable')).toBe(false);
    expect(isRetryableFailure('missing')).toBe(false);
  });
});
