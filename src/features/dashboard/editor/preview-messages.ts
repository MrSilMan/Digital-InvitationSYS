/**
 * Messages between the editor and its preview iframe (same origin only).
 *
 * The editor numbers its drafts: `{ type: PREVIEW_REFRESH, version }` asks the preview to render
 * again once draft `version` is stored. The preview answers `{ type: PREVIEW_UPDATED, version }`
 * with the version it now shows, and 0 when it (re)loads. A message sent while the iframe was
 * still loading is lost, so the editor sends again until the versions match.
 */
export const PREVIEW_REFRESH = 'convites:preview-refresh';
export const PREVIEW_UPDATED = 'convites:preview-updated';

export interface PreviewMessage {
  type: typeof PREVIEW_REFRESH | typeof PREVIEW_UPDATED;
  version: number;
}

/** The message's version if it is a `type` message from this origin, else null. */
export function previewMessageVersion(event: MessageEvent, type: string): number | null {
  if (event.origin !== window.location.origin) return null;
  const data: unknown = event.data;
  if (typeof data !== 'object' || data === null) return null;
  const { type: messageType, version } = data as { type?: unknown; version?: unknown };
  return messageType === type && typeof version === 'number' ? version : null;
}
