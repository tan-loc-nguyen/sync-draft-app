import { User } from '@/types/user';
import axios from 'axios';
import { useState } from 'react'
import useAuth from './useAuth';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';

const useProfile = () => {
  const apiUri = import.meta.env.VITE_API_ENDPOINT;
  const { getToken, user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState<boolean>(false);

  const getUserProfile = async () => {
    setLoading(true);
    setProfileErr(null);

    try {
      const token = await getToken();

      const response = await axios.get<User>(
        `${apiUri}/users`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      console.log(`Current profile: ${response.data}`);
      setProfile(response.data);
      return response.data;
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        setNoProfile(true);
        return;
      }
      console.error(`Error occurs while getting profile: ${getErrorMessage(error)}`);
      setProfileErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const createUserProfile = async () => {
    setLoading(true);
    setProfileErr(null);

    try {
      const token = await getToken();

      const response = await axios.post<User>(
        `${apiUri}/users`,
        {
          email: user?.email,
          userId: user?.sub
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      console.log(`Created profile: ${response.data}`);
      setProfile(response.data);
      return response.data;
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        setNoProfile(true);
      }
      console.error(`Error occurs while creating profile: ${getErrorMessage(error)}`);
      setProfileErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    profileErr,
    profile,
    noProfile,
    getUserProfile,
    createUserProfile
  }
}

export default useProfile;