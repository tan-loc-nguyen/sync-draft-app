import * as A from '@automerge/automerge';

export type SyncDoc = {
  content: string;
};

/**
 * Turns "here is the new full text" into the smallest possible splice.
 *
 * The editor hands back the whole document on every keystroke. Writing that in
 * wholesale would record it as one replacement of the entire field, and two
 * people typing at once would conflict over the whole document. Narrowing the
 * change to the region that actually differs lets Automerge merge concurrent
 * edits character by character.
 *
 * Mirrors the same helper on the server so both ends produce comparable edits.
 */
export const applyContentUpdate = (doc: A.Doc<SyncDoc>, next: string): A.Doc<SyncDoc> => {
  const prev = doc.content ?? '';

  if (prev === next) {
    return doc;
  }

  // A replica that has not synced yet has no `content` field, and splicing into
  // a field that does not exist throws. Create it on the first edit instead.
  if (typeof doc.content !== 'string') {
    return A.change(doc, (draft) => {
      draft.content = next;
    });
  }

  const limit = Math.min(prev.length, next.length);
  let start = 0;
  while (start < limit && prev[start] === next[start]) {
    start++;
  }

  let prevEnd = prev.length;
  let nextEnd = next.length;
  while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) {
    prevEnd--;
    nextEnd--;
  }

  return A.change(doc, (draft) => {
    A.splice(draft, ['content'], start, prevEnd - start, next.slice(start, nextEnd));
  });
};
