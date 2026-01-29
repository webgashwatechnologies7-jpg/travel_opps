import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((err, defaultMessage = 'An error occurred') => {
    console.error('Error occurred:', err);
    
    let errorMessage = defaultMessage;
    
    if (err.response?.data) {
      // Handle different error response formats
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.data.errors) {
        // Handle validation errors
        const errors = err.response.data.errors;
        if (typeof errors === 'object') {
          const errorArray = Object.values(errors).flat();
          errorMessage = errorArray.join(', ');
        } else {
          errorMessage = errors;
        }
      }
    } else if (err.message) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    // Add error code if available
    const errorCode = err.response?.data?.code;
    if (errorCode) {
      errorMessage = `[${errorCode}] ${errorMessage}`;
    }
    
    setError(errorMessage);
    return errorMessage;
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const executeWithErrorHandling = useCallback(async (asyncFunction, successMessage = '') => {
    setLoading(true);
    clearError();
    
    try {
      const result = await asyncFunction();
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = handleError(err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    setError,
    loading,
    setLoading,
    handleError,
    clearError,
    executeWithErrorHandling
  };
};
