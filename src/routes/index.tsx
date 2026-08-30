import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { withAuthenticationRequired } from "@auth0/auth0-react";

import Home from '@/screens/Home';
import DocumentScreen from '@/screens/Document';
import Error from '@/screens/Error';
import OnBoarding from "@/screens/OnBoarding";
import Draft from '@/screens/Draft';
import { currentReturnTo } from '@/lib/return-to';

// Wrapped once at module scope. Building these inside a render would create a
// new component type on every pass, remounting the screen and losing its state.
//
// `returnTo` records the page that was actually asked for. Without it, someone
// following a share link signs in and lands on the document list instead of the
// document they were invited to.
const guard = <P extends object>(Component: React.ComponentType<P>) =>
  withAuthenticationRequired(Component, { returnTo: currentReturnTo });

const ProtectedHome = guard(Home);
const ProtectedDocument = guard(DocumentScreen);
const ProtectedDraft = guard(Draft);

const router = createBrowserRouter([
  {
    path: '/',
    element: <OnBoarding/>,
  },
  {
    path: '/document',
    element: <ProtectedHome/>,
  },
  {
    path: '/document/:docId',
    element: <ProtectedDocument/>,
    errorElement: <Error/>,
  },
  {
    path: '/draft/:docId/:draftId',
    element: <ProtectedDraft/>,
    errorElement: <Error/>
  }
]);

export default router;
