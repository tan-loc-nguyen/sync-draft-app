/* eslint-disable react-hooks/rules-of-hooks -- useLocalDB holds no React state;
   it only returns async IndexedDB helpers, so it is safe outside a component. */
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { IDBPDatabase } from 'idb';
import * as A from '@automerge/automerge';

import { draftContent, useLocalDB } from './useLocalDB';
import { applyContentUpdate, SyncDoc } from '@/lib/automerge-doc';

const {
  openIndexedDB,
  createDraft,
  saveDraftDoc,
  updateDraftTitle,
  markDraftMerged,
  getDraftById,
  getDraftsByDocId,
} = useLocalDB();

const USER = 'auth0|someone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: IDBPDatabase<any>;

const docWith = (text: string) => A.from<SyncDoc>({ content: text });

beforeEach(async () => {
  // Fresh IndexedDB per test so drafts cannot leak between cases.
  globalThis.indexedDB = new IDBFactory();
  db = (await openIndexedDB(USER))!;
});

describe('openIndexedDB', () => {
  it('returns nothing when there is no signed-in user', async () => {
    expect(await openIndexedDB(undefined)).toBeUndefined();
  });
});

describe('drafts', () => {
  it('stores a draft and reads its text back', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('<p>hello</p>'), 'Intro rewrite');

    const draft = await getDraftById(db, 'draft-1');

    expect(draft).toMatchObject({
      docId: 'doc-1',
      draftId: 'draft-1',
      title: 'Intro rewrite',
      isMerged: false,
    });
    expect(draftContent(draft!)).toBe('<p>hello</p>');
  });

  it('defaults an untitled draft', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith(''));

    expect((await getDraftById(db, 'draft-1'))?.title).toBe('Untitled');
  });

  it('lists only the drafts belonging to one document', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('a'));
    await createDraft(db, 'doc-1', 'draft-2', docWith('b'));
    await createDraft(db, 'doc-2', 'draft-3', docWith('c'));

    const drafts = await getDraftsByDocId(db, 'doc-1');

    expect(drafts.map((d) => d.draftId).sort()).toEqual(['draft-1', 'draft-2']);
  });

  it('saves an edited draft document without disturbing the title', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('first'), 'Chapter one');

    const draft = await getDraftById(db, 'draft-1');
    const edited = applyContentUpdate(A.load<SyncDoc>(draft!.doc), 'second');
    await saveDraftDoc(db, 'draft-1', edited);

    const reloaded = await getDraftById(db, 'draft-1');
    expect(reloaded?.title).toBe('Chapter one');
    expect(draftContent(reloaded!)).toBe('second');
  });

  it('updates the title without disturbing the content', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('body text'), 'Old name');

    await updateDraftTitle(db, 'draft-1', 'New name');

    const draft = await getDraftById(db, 'draft-1');
    expect(draft?.title).toBe('New name');
    expect(draftContent(draft!)).toBe('body text');
  });

  it('marks a draft as merged', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('text'));

    await markDraftMerged(db, 'draft-1');

    expect((await getDraftById(db, 'draft-1'))?.isMerged).toBe(true);
  });

  // A draft is a branch: it keeps the history it was forked from, so merging it
  // back combines both sides instead of one replacing the other.
  it('keeps a fork mergeable with the document it came from', async () => {
    const main = docWith('<p>intro</p><p>outro</p>');
    await createDraft(db, 'doc-1', 'draft-1', A.clone(main), 'Branch');

    // Main moves on while the draft is edited separately.
    const mainAdvanced = applyContentUpdate(main, '<p>intro edited</p><p>outro</p>');

    const draft = await getDraftById(db, 'draft-1');
    const branch = applyContentUpdate(
      A.load<SyncDoc>(draft!.doc),
      '<p>intro</p><p>outro rewritten</p>'
    );

    const merged = A.merge(A.clone(mainAdvanced), branch);

    expect(merged.content).toContain('intro edited');
    expect(merged.content).toContain('outro rewritten');
  });

  // The Draft screen tells the user "Saved!" straight after calling this, so a
  // failed write must surface rather than be swallowed.
  it('reports a failure when saving a draft that does not exist', async () => {
    await expect(saveDraftDoc(db, 'missing-draft', docWith('text'))).rejects.toThrow();
  });

  it('reports a failure when renaming a draft that does not exist', async () => {
    await expect(updateDraftTitle(db, 'missing-draft', 'name')).rejects.toThrow();
  });

  it('reports a failure when creating a draft whose id is already taken', async () => {
    await createDraft(db, 'doc-1', 'draft-1', docWith('first'));

    await expect(createDraft(db, 'doc-1', 'draft-1', docWith('second'))).rejects.toThrow();
  });
});
