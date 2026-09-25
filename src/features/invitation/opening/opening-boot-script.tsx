import { EARLY_TAP_FLAG, ENVELOPE_ATTRIBUTE, OPENED_ATTRIBUTE } from './constants';

/**
 * Runs while the HTML is parsed, before the envelope is painted (carries the request's CSP nonce):
 * - skips the envelope when this tab already opened the invitation;
 * - remembers a tap on the envelope made before React is ready (slow phones: the JavaScript may
 *   still be downloading), so the envelope opens as soon as it is, instead of ignoring the tap.
 * Without JavaScript, a <noscript> style hides the envelope instead and shows the invitation behind
 * it (app/globals.css skips rendering it while the envelope is closed).
 */
export function OpeningBootScript({ nonce, storageKey }: { nonce?: string; storageKey: string }) {
  const code =
    `try{if(sessionStorage.getItem(${JSON.stringify(storageKey)})==='1')` +
    `document.documentElement.setAttribute(${JSON.stringify(OPENED_ATTRIBUTE)},'')}catch(e){}` +
    `document.addEventListener('click',function(e){var t=e.target;` +
    `if(t&&t.closest&&t.closest('[${ENVELOPE_ATTRIBUTE}]'))window[${JSON.stringify(EARLY_TAP_FLAG)}]=true},true);`;
  return (
    <>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />
      <noscript>
        <style>
          {
            '[data-opening-screen]{display:none}[data-behind-envelope]{content-visibility:visible!important}'
          }
        </style>
      </noscript>
    </>
  );
}
