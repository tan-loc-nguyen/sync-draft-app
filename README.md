# Sync Draft — web client

React client for Sync Draft: collaborative document editing with a git-like
draft-and-merge workflow, built on Automerge CRDTs.

Pairs with [`sync-draft-server`](../sync-draft-server).

## Stack

React 19 · Vite 8 · TypeScript · Tailwind 4 · shadcn/Radix · TipTap (ProseMirror)
· Automerge 3 · Socket.IO · Auth0 · IndexedDB (`idb`)

## The two modes

**Main document** — `useDocumentSync` holds this browser's Automerge replica and
runs the sync protocol with the server. Everyone editing the document converges;
concurrent edits merge instead of overwriting.

**Drafts** — a draft is a *fork* of the document, stored in IndexedDB and private
to your browser until you merge it. Because it keeps the history it was forked
from, merging it back is a real Automerge merge against a shared ancestor, not
one version replacing another.

The compare view shows main beside the merge result before you commit to it, and
merged drafts are recorded in the document's merge history.

## Getting started

```bash
yarn install
cp .env.example .env    # then fill in the Auth0 values
yarn dev
```

Start the server first — the client needs it for the API and the socket.

## Scripts

| Command | Purpose |
|---|---|
| `yarn dev` | Vite dev server on :5173 |
| `yarn build` | Type-check and build for production |
| `yarn preview` | Serve the production build |
| `yarn test` | Vitest (jsdom + fake-indexeddb) |
| `yarn lint` | ESLint |

## Notes

- The document body is currently modelled as one Automerge text field holding
  HTML. That merges cleanly when people work in different regions. Moving to
  `@automerge/prosemirror` would make rich-text merging structurally correct;
  it was left out while that package is still at 0.x.
