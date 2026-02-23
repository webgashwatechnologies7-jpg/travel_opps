import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API calls with loading and error states.
 */
const useApi = (apiFunc) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFunc(...args);
            setData(response.data.data || response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Something went wrong';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunc]);

    return {
        data,
        loading,
        error,
        request,
        setData
    };
};

export default useApi;
