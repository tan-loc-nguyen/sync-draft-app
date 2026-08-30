import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as A from '@automerge/automerge';

import { applyContentUpdate, SyncDoc } from '@/lib/automerge-doc';

const areHeadsEqual = (a: A.Heads, b: A.Heads) =>
  a.length === b.length && a.every((head, index) => head === b[index]);

import useAuth from './useAuth';

interface UseDocumentSync {
  /**
   * Content to render into the editor. Only advances on changes arriving from
   * other people: echoing local keystrokes back would reset the editor to a
   * stale value mid-typing and fight the caret.
   */
  content: string;
  onlineUsers: string[];
  connected: boolean;
  syncError: string | null;
  /** Push a new full document body from the editor into the CRDT. */
  publish: (html: string) => void;
  /** A copy of this client's replica, for forking a draft from it. */
  snapshot: () => A.Doc<SyncDoc>;
  /** The live text, including local edits not yet reflected in `content`. */
  currentContent: () => string;
  /** Merge a branch back in. Both sides share history, so this is a real merge. */
  mergeBranch: (branch: A.Doc<SyncDoc>) => void;
}

/**
 * Owns this client's replica of a document and the Automerge sync exchange with
 * the server.
 *
 * The document and sync state live in refs rather than state: they change on
 * every message, and re-rendering the editor for each one would fight the
 * cursor. Only the rendered content and presence list drive React.
 */
export const useDocumentSync = (docId: string | undefined): UseDocumentSync => {
  const socketUri = import.meta.env.VITE_SOCKET_ENDPOINT || 'http://localhost:3030';
  const { getToken, isAuthenticated } = useAuth();

  const [content, setContent] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Held in a ref: the effect must not reconnect just because a caller handed
  // us a new function identity on re-render.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const socketRef = useRef<Socket | null>(null);
  const docRef = useRef<A.Doc<SyncDoc>>(A.init<SyncDoc>());
  const syncStateRef = useRef<A.SyncState>(A.initSyncState());

  // Sends whatever the server is still missing. Safe to call repeatedly: it
  // emits nothing once both sides agree.
  const flush = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const [nextState, message] = A.generateSyncMessage(docRef.current, syncStateRef.current);
    syncStateRef.current = nextState;

    if (message) {
      socket.emit('sync', message);
    }
  }, []);

  useEffect(() => {
    if (!docId || !isAuthenticated) return;

    let disposed = false;
    let socket: Socket | undefined;

    const connect = async () => {
      const token = await getTokenRef.current();
      if (disposed || !token) return;

      // Start from an empty replica; the server sends the shared history, which
      // is what lets later edits merge rather than overwrite.
      docRef.current = A.init<SyncDoc>();
      syncStateRef.current = A.initSyncState();

      socket = io(socketUri, {
        transports: ['websocket'],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setSyncError(null);
        socket?.emit('join-doc', { docId });
      });

      socket.on('connect_error', (error) => {
        setSyncError(error.message);
        setConnected(false);
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('sync', (message: ArrayBuffer) => {
        const before = A.getHeads(docRef.current);

        const [doc, state] = A.receiveSyncMessage(
          docRef.current,
          syncStateRef.current,
          new Uint8Array(message)
        );
        docRef.current = doc;
        syncStateRef.current = state;

        // Much of the traffic is protocol chatter, or the server echoing back
        // changes we just sent. Those leave our document exactly where it was,
        // and pushing the text into the editor again would rewind whatever the
        // user has typed since. Only publish genuinely new history.
        const advanced = !areHeadsEqual(before, A.getHeads(doc));
        if (advanced) {
          setContent(doc.content ?? '');
        }

        // Answer immediately so the exchange runs to completion.
        flush();
      });

      socket.on('online-users', (users: string[]) => setOnlineUsers(users));

      socket.on('doc-error', ({ message }: { message: string }) => setSyncError(message));
    };

    connect();

    return () => {
      disposed = true;
      if (socket) {
        socket.emit('leave-doc', { docId });
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [docId, isAuthenticated, socketUri, flush]);

  const publish = useCallback(
    (html: string) => {
      const updated = applyContentUpdate(docRef.current, html);

      // Nothing actually changed (for instance the editor re-emitting identical
      // HTML) — do not send a message.
      if (updated === docRef.current) return;

      docRef.current = updated;
      // Deliberately not calling setContent here — see the note on `content`.
      flush();
    },
    [flush]
  );

  const snapshot = useCallback(() => A.clone(docRef.current), []);

  const currentContent = useCallback(() => docRef.current.content ?? '', []);

  // Because a draft was forked from this document, Automerge can combine the
  // two histories instead of one version replacing the other.
  const mergeBranch = useCallback(
    (branch: A.Doc<SyncDoc>) => {
      docRef.current = A.merge(docRef.current, branch);
      setContent(docRef.current.content ?? '');
      flush();
    },
    [flush]
  );

  return {
    content,
    onlineUsers,
    connected,
    syncError,
    publish,
    snapshot,
    currentContent,
    mergeBranch,
  };
};

export default useDocumentSync;
