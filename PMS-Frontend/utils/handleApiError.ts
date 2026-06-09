import { toast } from 'sonner';

export function handleApiError(error: any, defaultMessage: string = 'An unexpected error occurred') {
  console.error('API Error:', error);
  
  let errorMessage = defaultMessage;
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = error.response.data?.detail || error.response.data?.message || defaultMessage;
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response from server. Please check your network connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message || defaultMessage;
  }

  toast.error(errorMessage);
  return errorMessage;
}
