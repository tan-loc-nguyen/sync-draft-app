import { useState } from 'react'
import useAuth from './useAuth';
import axios from 'axios';
import { Document } from '@/types/document';
import { getErrorMessage } from '@/lib/errors';

const useDocument = () => {
  const baseUri = import.meta.env.VITE_API_ENDPOINT;
  const { getToken } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [documentErr, setDocumentErr] = useState<string | null>(null);

  const getDocuments = async (whose: string): Promise<Document[] | undefined> => {
    setLoading(true);
    setDocumentErr(null);

    try {
      const token = await getToken();

      const response = await axios.get<Document[]>(
        `${baseUri}/documents?q=${whose}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      return response.data;
    } catch (error) {
      console.error(`Error occurs while getting documents: ${getErrorMessage(error)}`);
      setDocumentErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const getDocumentById = async (docId: string): Promise<Document | undefined> => {
    setLoading(true);
    setDocumentErr(null);

    try {
      const token = await getToken();

      const response = await axios.get<Document>(
        `${baseUri}/documents/${docId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      return response.data;
    } catch (error) {
      console.error(`Error occurs while getting document: ${getErrorMessage(error)}`);
      setDocumentErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const createDocument = async () => {
    setLoading(true);
    setDocumentErr(null);

    try {
      const token = await getToken();

      const response = await axios.post<Document>(
        `${baseUri}/documents`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      console.log(`Created document: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error(`Error occurs while creating document: ${getErrorMessage(error)}`);
      setDocumentErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const updateDocTitle = async (docId: string, newTitle: string) => {
    setLoading(true);
    setDocumentErr(null);

    try {
      const token = await getToken();

      const response = await axios.put<Document>(
        `${baseUri}/documents/${docId}`,
        {
          newTitle: newTitle
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      console.log(`Updated document: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error(`Error occurs while update doc title: ${getErrorMessage(error)}`);
      setDocumentErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const deleteDocumentById = async (docId: string) => {
    setLoading(true);
    setDocumentErr(null);

    try {
      const token = await getToken();

      const response = await axios.delete<Document>(
        `${baseUri}/documents/${docId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      console.log(`Deleted document: ${response.data.id}`);
    } catch (error) {
      console.error(`Error occurs while update doc title: ${getErrorMessage(error)}`);
      setDocumentErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    documentErr,
    getDocumentById,
    getDocuments,
    createDocument,
    updateDocTitle,
    deleteDocumentById
  }
}

export default useDocument