import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';

import router from './routes';
import { resolveReturnTo } from './lib/return-to';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || ''}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || ''}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_CALLBACK_URL,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid email profile"
      }}
      // Auth0 always returns to the single registered callback URL, so the page
      // the user actually wanted is carried in appState and restored here.
      onRedirectCallback={(appState) => {
        router.navigate(resolveReturnTo(appState), { replace: true });
      }}
    >
      <RouterProvider router={router} />
    </Auth0Provider>
  </StrictMode>
);
