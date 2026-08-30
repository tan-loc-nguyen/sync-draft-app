import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';

const useAuth = () => {
  const { loginWithRedirect, logout, getAccessTokenSilently, user, isAuthenticated } = useAuth0();
  const [loading, setLoading] = useState<boolean>(false);
  const [authErr, setAuthErr] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    setLoading(true);
    setAuthErr(null);

    try {
      const token = await getAccessTokenSilently();
      // console.log(token);
      return token;
    } catch (error) {
      console.error(`Error occurs while getting token: ${getErrorMessage(error)}`);
      setAuthErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  const login = useCallback(async () => {
    setLoading(true);
    setAuthErr(null);

    try {
      await loginWithRedirect();
    } catch (error) {
      console.error(`Error occurs while logging in: ${getErrorMessage(error)}`);
      setAuthErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loginWithRedirect]);

  const signup = useCallback(async () => {
    setLoading(true);
    setAuthErr(null);

    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup'
        }
      });
    } catch (error) {
      console.error(`Error occurs while signing up: ${getErrorMessage(error)}`);
      setAuthErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loginWithRedirect]);

  return {
    loading,
    authErr,
    user,
    isAuthenticated,
    login,
    signup,
    getToken,
    logout
  }

}

export default useAuth;