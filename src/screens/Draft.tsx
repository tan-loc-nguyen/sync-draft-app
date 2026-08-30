import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SaveIcon } from 'lucide-react';
import * as A from '@automerge/automerge';

import { DocumentIcon, HomeIcon } from '@/assets/icons';
import TitleInput from '@/components/TitleInput';
import Editor from '@/components/Editor';
import DraftItem from '@/components/DraftItem';
import { Button } from '@/components/ui/button';
import useAuth from '@/hook/useAuth';
import { IDraft, useLocalDB } from '@/hook/useLocalDB';
import { applyContentUpdate, SyncDoc } from '@/lib/automerge-doc';
import { useToast } from '@/components/Toast';

const Draft = () => {
  const { docId, draftId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.sub;
  const { updateDraftTitle, openIndexedDB, saveDraftDoc, getDraftById, getDraftsByDocId } =
    useLocalDB();

  const { notify, toastElement } = useToast();

  const [draftTitle, setDraftTitle] = useState<string>('Untitled');
  // The draft's own Automerge document, held in a ref. An Automerge document
  // becomes outdated the moment it is changed, so it must never be advanced
  // inside a setState updater: React may call an updater more than once with
  // the same input, and the second call would throw.
  const docRef = useRef<A.Doc<SyncDoc> | null>(null);
  // Snapshot used to seed the editor; local keystrokes deliberately do not
  // feed back into it, or the editor would fight the caret.
  const [initialContent, setInitialContent] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [drafts, setDrafts] = useState<IDraft[]>([]);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !draftId || !docId) return;

    const db = await openIndexedDB(userId);
    if (!db) {
      notify('Could not open your local drafts.', 'error');
      return;
    }

    const draft = await getDraftById(db, draftId);

    if (!draft) {
      notify('That draft no longer exists.', 'error');
      navigate(`/document/${docId}`);
      return;
    }

    setDraftTitle(draft.title || 'Untitled');
    docRef.current = A.load<SyncDoc>(draft.doc);
    setInitialContent(docRef.current.content ?? '');
    setReady(true);
    setDrafts(await getDraftsByDocId(db, docId));
  }, [userId, draftId, docId, navigate]);

  useEffect(() => {
    // load() sets state only after awaiting IndexedDB: ordinary async loading,
    // not the synchronous cascade this rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleEditorChange = (value: string) => {
    const current = docRef.current;
    if (!current) return;

    const next = applyContentUpdate(current, value);
    if (next === current) return;

    docRef.current = next;
    setDirty(true);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTitle(event.target.value);
  };

  const changeTitle = async (event: React.FocusEvent<HTMLInputElement, Element>) => {
    event.preventDefault();
    if (!draftId || !userId) return;

    const db = await openIndexedDB(userId);
    if (!db) return;

    try {
      await updateDraftTitle(db, draftId, draftTitle);
    } catch (error) {
      console.error(error);
      notify('Could not rename the draft.', 'error');
    }
  };

  const handleSaveDraft = async () => {
    if (!userId || !draftId || !docRef.current) return;

    const db = await openIndexedDB(userId);
    if (!db) {
      notify('Could not open your local drafts.', 'error');
      return;
    }

    try {
      await saveDraftDoc(db, draftId, docRef.current);
      setDirty(false);
      notify('Draft saved');
    } catch (error) {
      console.error(error);
      notify('Could not save the draft.', 'error');
    }
  };

  return (
    <div className='container h-screen flex flex-row'>
      {toastElement}
      <div className='w-4/5 h-full p-4 flex flex-col justify-start'>
        <div className='w-full h-[60px] flex flex-row justify-between items-center'>
          <div className='w-4/5 h-[48px] flex flex-row justify-start items-center'>
            <a href='/document'>
              <Button variant='ghost' size='lg'>
                <HomeIcon />
                Home
              </Button>
            </a>
            <TitleInput value={draftTitle} onChange={handleTitleChange} onBlur={changeTitle} />
          </div>
          <div className='w-1/5 h-[60px] flex flex-row-reverse items-center gap-3'>
            <Button size='lg' onClick={handleSaveDraft} disabled={!ready}>
              <SaveIcon />
              Save
            </Button>
            {dirty && <span className='text-sm text-gray-500'>Unsaved</span>}
          </div>
        </div>

        <p className='text-sm text-gray-500'>
          This draft is private to your browser until you merge it into the document.
        </p>

        <Editor onChange={handleEditorChange} content={initialContent} />
      </div>

      <div className='w-1/5 h-full p-4 bg-gray-100 flex flex-col justify-start'>
        <Button
          className='w-full'
          variant='outline'
          size='lg'
          onClick={() => navigate(`/document/${docId}`)}
        >
          <DocumentIcon />
          Return to main
        </Button>

        <div className='grow-0 w-full h-[28px] mt-4 text-[20px] font-semibold'>Drafts</div>
        <div className='grow w-full mt-2 rounded-lg flex flex-col justify-start items-start overflow-auto'>
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
      </div>
    </div>
  );
};

export default Draft;
