// lib/data-profiler/download.ts
//
// Thin DOM adapter that hands a generated document to the browser's download
// mechanism. Impure by necessity (it touches `document` and `URL`), but it
// holds no state and makes no decisions beyond the ones documented below.
//
// NO NETWORK. A `Blob` object URL is local by construction: `createObjectURL`
// mints a `blob:` URL backed by the in-memory blob, and the anchor click
// resolves it against the same-origin blob store. Nothing in this module opens
// a socket — there is no `fetch`, no `XMLHttpRequest`, no form submission, no
// `sendBeacon`. Zero bytes of the exported document leave the page
// (Requirement 7.5). The `fetch`-spy integration test in task 14 asserts this
// from the outside as well.
//
// Failures propagate. Every throw here is intentional so the caller can show
// the "no file was saved" error and re-enable the export control
// (Requirement 7.8). The `finally` block guarantees that a throw never leaves
// a live object URL or an orphan anchor behind.
//
// _Requirements: 7.1, 7.2, 7.5, 7.8_

/**
 * Text MIME types get an explicit `charset=utf-8`.
 *
 * The export can carry non-ASCII content — Filipino place names, CJK column
 * headers, accented labels. `Blob` always encodes a `string` part as UTF-8, but
 * the *declared* type is what a consumer reads when the saved file is opened or
 * re-served, and a `text/markdown` file with no charset is interpreted per the
 * consumer's default, which is how mojibake happens. Declaring the charset
 * costs nothing and removes the ambiguity.
 *
 * A caller that already supplied a `charset` parameter is left alone, and
 * non-text types are left alone (a charset is meaningless on binary media).
 */
function withUtf8Charset(mime: string): string {
  const normalized = mime.trim();
  if (normalized === '') return 'application/octet-stream';
  if (/;\s*charset=/i.test(normalized)) return normalized;
  const isTextual =
    normalized.startsWith('text/') ||
    /^application\/(json|xml|.*\+json|.*\+xml)$/i.test(
      normalized.split(';')[0].trim(),
    );
  return isTextual ? `${normalized};charset=utf-8` : normalized;
}

/**
 * Starts a browser download of `text` as `filename`.
 *
 * Creates a `Blob`, mints an object URL, clicks a synthetic anchor carrying the
 * `download` attribute, then releases the URL and removes the anchor in a
 * `finally` block.
 *
 * The anchor is appended to the document before the click and removed after.
 * A detached anchor's click is honoured by current engines, but the
 * append/click/remove sequence is the broadly compatible form, so that is what
 * is used.
 *
 * **The revoke is synchronous, not deferred.** `HTMLAnchorElement.click()`
 * dispatches its event synchronously, and the navigate-to-download that the
 * default action queues captures the blob before `click()` returns, so a
 * `revokeObjectURL` on the next line does not cancel an in-flight save.
 * The alternative — deferring the revoke to a timer — buys nothing here and
 * costs the guarantee that matters most for Requirement 7.8: with a deferred
 * revoke, a throw between minting and scheduling leaks the URL for the life of
 * the document, and a caller cannot observe or clean up that leak. Revoking in
 * `finally` makes release unconditional. This also matches the design's module
 * contract ("Blob + object URL, revoked in `finally`").
 *
 * @throws When the environment has no DOM or no `URL.createObjectURL`, or when
 * blob creation, the click, or DOM insertion fails. The caller surfaces the
 * error; this function never swallows one.
 */
export function triggerDownload(
  filename: string,
  mime: string,
  text: string,
): void {
  // This module can be imported during SSR even though it is only ever called
  // from an event handler. Fail with a legible message instead of a bare
  // `document is not defined` from somewhere deeper in the sequence.
  if (typeof document === 'undefined') {
    throw new Error(
      'triggerDownload requires a browser document; it cannot run on the server.',
    );
  }
  if (
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    throw new Error(
      'triggerDownload requires URL.createObjectURL, which this environment does not provide.',
    );
  }

  const blob = new Blob([text], { type: withUtf8Charset(mime) });
  const objectUrl = URL.createObjectURL(blob);
  let anchor: HTMLAnchorElement | null = null;

  try {
    anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    // Belt and braces: a download-attributed anchor never navigates the page,
    // but if an engine ignored the attribute the click would replace the view.
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    // Runs on the success path and on every throw above, so neither the URL
    // nor the anchor can outlive this call.
    anchor?.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
