import { openDB, DBSchema, IDBPDatabase } from 'idb';
import * as A from '@automerge/automerge';

import { toTime } from '@/lib/utils';
import { SyncDoc } from '@/lib/automerge-doc';

export interface IDraft {
  docId: string,
  draftId: string,
  title: string,
  /**
   * The draft's Automerge document, saved to bytes. Storing the whole document
   * rather than its rendered HTML is what makes a draft a real branch: it keeps
   * the history it was forked from, so merging it back is a genuine merge
   * against a shared ancestor rather than one version overwriting another.
   */
  doc: Uint8Array,
  createdAt: string,
  isMerged: boolean
}

interface SyncDraftDB extends DBSchema {
  drafts: {
    key: string,
    value: IDraft
  }
}

/** Reads the current text out of a stored draft. */
export const draftContent = (draft: IDraft): string =>
  A.load<SyncDoc>(draft.doc).content ?? '';

const openIndexedDB = async (userId: string | undefined) : Promise<IDBPDatabase<SyncDraftDB> | undefined>=> {
  try {
    if (!userId) return;

    const db = await openDB<SyncDraftDB>(userId, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts' , {
            keyPath: 'draftId'
          });
        }
      }
    })

    return db;
  } catch (error) {
    console.log(`[IndexedDB] Error while opening: ${error}`);
  }
}

// These writes all propagate their failures: callers report success to the
// user straight after awaiting them, so a swallowed error would show "Saved!"
// over a draft that was never written.
const createDraft = async (
  db: IDBPDatabase<SyncDraftDB>,
  docId: string,
  draftId: string,
  doc: A.Doc<SyncDoc>,
  title: string = 'Untitled',
) : Promise<void> => {
  await db.add('drafts', {
    docId,
    draftId,
    title,
    doc: A.save(doc),
    createdAt: toTime((new Date()).toString()),
    isMerged: false
  })
}

const saveDraftDoc = async (
  db: IDBPDatabase<SyncDraftDB>,
  draftId: string,
  doc: A.Doc<SyncDoc>
) : Promise<void> => {
  const oldDraft = await db.get('drafts', draftId);

  if (!oldDraft) {
    throw new Error(`[IndexedDB] Draft not found: ${draftId}`);
  }

  await db.put('drafts', { ...oldDraft, doc: A.save(doc) });
}

const updateDraftTitle = async (
  db: IDBPDatabase<SyncDraftDB>,
  draftId: string,
  updatedTitle: string
) : Promise<void> => {
  const oldDraft = await db.get('drafts', draftId);

  if (!oldDraft) {
    throw new Error(`[IndexedDB] Draft not found: ${draftId}`);
  }

  await db.put('drafts', { ...oldDraft, title: updatedTitle });
}

const markDraftMerged = async (
  db: IDBPDatabase<SyncDraftDB>,
  draftId: string
) : Promise<void> => {
  const oldDraft = await db.get('drafts', draftId);

  if (!oldDraft) {
    throw new Error(`[IndexedDB] Draft not found: ${draftId}`);
  }

  await db.put('drafts', { ...oldDraft, isMerged: true });
}

const getDraftById = async (
  db: IDBPDatabase<SyncDraftDB>,
  draftId: string,
): Promise<IDraft | undefined> => {
  return await db.get('drafts', draftId);
}

const getDraftsByDocId = async (
  db: IDBPDatabase<SyncDraftDB>,
  docId: string
): Promise<IDraft[]> => {
  const drafts = await db.getAll('drafts');

  return drafts.filter(draft => draft.docId === docId);
}

/**
 * Stable helpers for the local draft store. They hold no React state, so the
 * same object is returned every time and callers' dependency arrays stay quiet.
 */
const localDB = {
  openIndexedDB,
  createDraft,
  saveDraftDoc,
  updateDraftTitle,
  markDraftMerged,
  getDraftById,
  getDraftsByDocId
} as const;

export const useLocalDB = () => localDB;
