import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import * as A from '@automerge/automerge';
import axios from 'axios';

import {
  BranchIcon,
  CloseIcon,
  CompareIcon,
  DocumentIcon,
  HomeIcon,
  LeftArrowIcon,
  MergeIcon,
  ShareIcon,
} from '@/assets/icons';
import TitleInput from '@/components/TitleInput';
import Editor from '@/components/Editor';
import { UserBubble } from '@/components/UserBubble';
import DraftItem from '@/components/DraftItem';
import MergeItem from '@/components/MergeItem';
import Merge from '@/components/Merge';
import { Button } from '@/components/ui/button';
import useDocument from '@/hook/useDocument';
import useAuth from '@/hook/useAuth';
import useDocumentSync from '@/hook/useDocumentSync';
import { IDraft, useLocalDB } from '@/hook/useLocalDB';
import { SyncDoc } from '@/lib/automerge-doc';
import { Merge as TypeMerge } from '@/types/merge';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/components/Toast';

const Document = () => {
  const apiUri = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3030/api';

  const { docId } = useParams();
  const navigate = useNavigate();
  const { updateDocTitle, getDocumentById } = useDocument();
  const { user, getToken } = useAuth();
  const userId = user?.sub;
  const { openIndexedDB, createDraft, getDraftById, getDraftsByDocId, markDraftMerged } = useLocalDB();

  // Live document state comes from the CRDT sync hook, not from local state.
  const {
    content,
    onlineUsers,
    connected,
    syncError,
    publish,
    snapshot,
    currentContent,
    mergeBranch,
  } = useDocumentSync(docId);

  const { notify, toastElement } = useToast();

  const [docTitle, setDocTitle] = useState<string>('Untitled');
  const [drafts, setDrafts] = useState<IDraft[]>([]);
  const [merges, setMerges] = useState<TypeMerge[]>([]);
  const [selection, setSelection] = useState<{ value: string; label: string } | null>(null);
  const [mergePreview, setMergePreview] = useState<string>('');
  // Captured when the merge dialog opens so the comparison is stable while open.
  const [mergeBase, setMergeBase] = useState<string>('');
  const [mergeIsOpen, setMergeIsOpen] = useState<boolean>(false);
  const [mergeViewIsOpen, setMergeViewIsOpen] = useState<boolean>(false);
  const [selectedMerge, setSelectedMerge] = useState<TypeMerge | null>(null);

  const refreshDrafts = useCallback(async () => {
    if (!userId || !docId) return;

    const db = await openIndexedDB(userId);
    if (!db) return;

    setDrafts(await getDraftsByDocId(db, docId));
  }, [userId, docId]);

  const refreshMerges = useCallback(async () => {
    if (!docId) return;

    try {
      const token = await getToken();
      const response = await axios.get<TypeMerge[]>(`${apiUri}/merges/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerges(response.data);
    } catch (error) {
      console.error(`Error occurs while fetching merges: ${getErrorMessage(error)}`);
    }
  }, [docId, apiUri, getToken]);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!docId) return;

      const doc = await getDocumentById(docId);

      if (doc) {
        setDocTitle(doc.title);
      } else {
        notify('This document has been deleted by its owner.', 'error');
        navigate('/document');
      }
    };

    fetchDoc();
    // getDocumentById is recreated per render; docId is the real input here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  /* eslint-disable react-hooks/set-state-in-effect -- both loaders set state
     only after awaiting IO, which is ordinary async data loading rather than
     the synchronous cascade this rule guards against. */
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  useEffect(() => {
    refreshMerges();
  }, [refreshMerges]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Build the preview by merging the chosen draft into a copy of this document.
  useEffect(() => {
    const buildPreview = async () => {
      if (!selection?.value || !userId) {
        setMergePreview('');
        return;
      }

      const db = await openIndexedDB(userId);
      if (!db) return;

      const draft = await getDraftById(db, selection.value);
      if (!draft) return;

      const merged = A.merge(snapshot(), A.load<SyncDoc>(draft.doc));
      setMergePreview(merged.content ?? '');
    };

    buildPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, userId]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDocTitle(event.target.value);
  };

  const changeTitle = (event: React.FocusEvent<HTMLInputElement, Element>) => {
    event.preventDefault();
    if (!docId) return;
    updateDocTitle(docId, docTitle);
  };

  const handleShare = async () => {
    if (!docId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/document/${docId}`);
    notify('Copied link to this document');
  };

  const handleCreateDraft = async () => {
    if (!userId || !docId) {
      notify('Could not create a draft. Please try again.', 'error');
      return;
    }

    const db = await openIndexedDB(userId);
    if (!db) {
      notify('Could not create a draft. Please try again.', 'error');
      return;
    }

    const newDraftId = uuidv4();

    try {
      // Forking from the live replica is what gives the draft a shared ancestor
      // with main, so merging it back later is a real merge.
      await createDraft(db, docId, newDraftId, snapshot());
      navigate(`/draft/${docId}/${newDraftId}`);
    } catch (error) {
      console.error(error);
      notify('Could not create a draft. Please try again.', 'error');
    }
  };

  const handleConfirmMerge = async () => {
    if (!selection?.value || !userId || !docId) return;

    const db = await openIndexedDB(userId);
    if (!db) return;

    const draft = await getDraftById(db, selection.value);
    if (!draft) return;

    const before = currentContent();
    mergeBranch(A.load<SyncDoc>(draft.doc));

    try {
      const token = await getToken();
      await axios.post<TypeMerge>(
        `${apiUri}/merges/${docId}`,
        { before, after: mergePreview, description: `Merged "${draft.title}"` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await markDraftMerged(db, draft.draftId);
    } catch (error) {
      console.error(`Error occurs while posting merge: ${getErrorMessage(error)}`);
    }

    setMergeIsOpen(false);
    setSelection(null);
    await Promise.all([refreshDrafts(), refreshMerges()]);
  };

  const openMergeView = (merge: TypeMerge) => {
    setSelectedMerge(merge);
    setMergeViewIsOpen(true);
  };

  const mergeOptions = drafts
    .filter((draft) => !draft.isMerged)
    .map((draft) => ({ value: draft.draftId, label: draft.title }));

  return (
    <div className='container h-screen flex flex-row'>
      {toastElement}
      {/* Past merge, shown read-only */}
      <Merge isOpen={mergeViewIsOpen} onRequestClose={() => setMergeViewIsOpen(false)}>
        <div className='w-full h-full flex flex-col'>
          <div className='grow-0 w-full h-fit flex flex-row justify-between items-center'>
            <h1 className='text-[20px] font-semibold'>Merge details</h1>
            <Button variant='ghost' size='icon' onClick={() => setMergeViewIsOpen(false)}>
              <CloseIcon />
            </Button>
          </div>
          <p className='grow-0 text-gray-500'>{selectedMerge?.description}</p>
          <div className='grow w-full my-4 flex flex-row justify-between items-stretch overflow-hidden'>
            <div className='w-[47.5%] p-4 border rounded-lg overflow-auto'>
              <p className='text-xs uppercase text-gray-400 mb-2'>Before</p>
              <Editor content={selectedMerge?.before ?? ''} editable={false} />
            </div>
            <div className='w-[47.5%] p-4 border rounded-lg overflow-auto'>
              <p className='text-xs uppercase text-gray-400 mb-2'>After</p>
              <Editor content={selectedMerge?.after ?? ''} editable={false} />
            </div>
          </div>
        </div>
      </Merge>

      {/* Merge a draft into main */}
      <Merge isOpen={mergeIsOpen} onRequestClose={() => setMergeIsOpen(false)}>
        <div className='w-full h-full flex flex-col'>
          <div className='grow-0 w-full h-fit flex flex-row justify-between items-center'>
            <h1 className='text-[20px] font-semibold'>Compare differences</h1>
            <Button variant='ghost' size='icon' onClick={() => setMergeIsOpen(false)}>
              <CloseIcon />
            </Button>
          </div>
          <p className='grow-0 text-gray-500'>
            Review the differences between your draft and the main version before merging.
          </p>

          <div className='grow-0 relative w-full h-[48px] mt-4 py-2 px-4 bg-gray-100 rounded-lg flex flex-row justify-start items-center'>
            <CompareIcon />
            <div className='w-fit h-[36px] mx-4 px-4 bg-white rounded font-normal border flex flex-row justify-center items-center'>
              Main
            </div>
            <LeftArrowIcon />
            <Select
              className='ml-4 min-w-[240px]'
              placeholder='Select draft to merge'
              value={selection}
              onChange={setSelection}
              options={mergeOptions}
            />
          </div>

          <div className='grow w-full my-4 flex flex-row justify-between items-stretch overflow-hidden'>
            <div className='w-[47.5%] p-4 border rounded-lg overflow-auto'>
              <p className='text-xs uppercase text-gray-400 mb-2'>Current main</p>
              <Editor content={mergeBase} editable={false} />
            </div>
            <div className='w-[47.5%] p-4 border rounded-lg overflow-auto'>
              <p className='text-xs uppercase text-gray-400 mb-2'>After merge</p>
              <Editor content={mergePreview} editable={false} />
            </div>
          </div>

          <div className='grow-0 w-full h-fit flex flex-row-reverse justify-start items-center'>
            <Button className='ml-4' onClick={handleConfirmMerge} disabled={!selection}>
              Confirm
            </Button>
            <Button variant='outline' onClick={() => setMergeIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Merge>

      {/* Editor side */}
      <div className='w-4/5 h-full p-4 flex flex-col justify-start'>
        <div className='w-full h-[60px] flex flex-row justify-between items-center'>
          <div className='w-4/5 h-[48px] flex flex-row justify-start items-center'>
            <a href='/document'>
              <Button variant='ghost' size='lg'>
                <HomeIcon />
                Home
              </Button>
            </a>
            <TitleInput value={docTitle} onChange={handleTitleChange} onBlur={changeTitle} />
          </div>
          <div className='w-1/5 h-[60px] flex flex-row-reverse justify-start items-center overflow-auto'>
            {onlineUsers.map((collaborator) => (
              <UserBubble key={collaborator} userId={collaborator} />
            ))}
          </div>
        </div>

        {syncError && (
          <p className='text-sm text-red-600' role='alert'>
            {syncError}
          </p>
        )}
        {!connected && !syncError && <p className='text-sm text-gray-500'>Connecting…</p>}

        <Editor onChange={publish} content={content} />
      </div>

      {/* Branching sidebar */}
      <div className='w-1/5 h-full p-4 bg-gray-100 flex flex-col justify-start'>
        <div className='grow-0 w-full flex flex-col gap-2 items-center'>
          <Button className='w-full' variant='outline' size='lg' onClick={handleShare}>
            <ShareIcon />
            Share document
          </Button>
          <Button className='w-full' variant='outline' size='lg' onClick={handleCreateDraft}>
            <BranchIcon />
            Create new draft
          </Button>
          <Button
            className='w-full'
            variant='outline'
            size='lg'
            onClick={() => { setMergeBase(currentContent()); setMergeIsOpen(true); }}
            disabled={mergeOptions.length === 0}
          >
            <MergeIcon />
            Merge draft
          </Button>
        </div>

        <div className='grow-0 w-full h-[28px] mt-4 text-[20px] font-semibold'>Drafts</div>
        <div className='grow w-full mt-2 rounded-lg flex flex-col justify-start items-start overflow-auto'>
          {drafts.length === 0 && <p className='text-sm text-gray-500'>No drafts yet.</p>}
          {drafts.map((draft) => (
            <DraftItem
              key={draft.draftId}
              docId={docId as string}
              draftId={draft.draftId}
              title={draft.title || 'Untitled'}
              isMerged={draft.isMerged}
              createdAt={draft.createdAt}
            />
          ))}
        </div>

        <div className='grow-0 w-full h-[28px] mt-4 text-[20px] font-semibold flex items-center gap-2'>
          <DocumentIcon />
          Recent merges
        </div>
        <div className='grow w-full mt-2 rounded-lg flex flex-col justify-start items-start overflow-auto'>
          {merges.length === 0 && <p className='text-sm text-gray-500'>No merges yet.</p>}
          {merges.map((merge) => (
            <MergeItem key={merge.id} merge={merge} onSelect={openMergeView} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Document;
