import { OPENED_ATTRIBUTE } from './constants';

/**
 * Runs while the HTML is parsed, before the envelope is painted: skips the envelope when this tab
 * already opened the invitation. Carries the request's CSP nonce. Without JavaScript, a <noscript>
 * style hides the envelope instead (the invitation stays readable).
 */
export function OpeningBootScript({ nonce, storageKey }: { nonce?: string; storageKey: string }) {
  const code =
    `try{if(sessionStorage.getItem(${JSON.stringify(storageKey)})==='1')` +
    `document.documentElement.setAttribute(${JSON.stringify(OPENED_ATTRIBUTE)},'')}catch(e){}`;
  return (
    <>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />
      <noscript>
        <style>{'[data-opening-screen]{display:none}'}</style>
      </noscript>
    </>
  );
}
