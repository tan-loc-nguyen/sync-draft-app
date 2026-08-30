import { createBrowserRouter } from "react-router-dom";
import { withAuthenticationRequired } from "@auth0/auth0-react";

import Home from '@/screens/Home';
import DocumentScreen from '@/screens/Document';
import Error from '@/screens/Error';
import OnBoarding from "@/screens/OnBoarding";
import Draft from '@/screens/Draft';

// Wrapped once at module scope. Building these inside a render would create a
// new component type on every pass, remounting the screen and losing its state.
const ProtectedHome = withAuthenticationRequired(Home);
const ProtectedDocument = withAuthenticationRequired(DocumentScreen);
const ProtectedDraft = withAuthenticationRequired(Draft);

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
