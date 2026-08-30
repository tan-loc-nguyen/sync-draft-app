import axios from 'axios';

// Caught values are `unknown`; these narrow them without spraying `any` through
// every catch block.
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const getErrorStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;
