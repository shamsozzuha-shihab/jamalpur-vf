import { useState, useEffect, useCallback, useRef } from 'react';

// Custom hook for API calls with caching and error handling
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    immediate = true,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const execute = useCallback(async (retryAttempt = 0) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    if (cacheKey && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      const result = await apiFunction(abortControllerRef.current.signal);
      
      setData(result);
      
      // Cache the result
      if (cacheKey) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      setError(err);
      
      // Retry logic
      if (retryAttempt < retryCount) {
        setTimeout(() => {
          execute(retryAttempt + 1);
        }, retryDelay * Math.pow(2, retryAttempt)); // Exponential backoff
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, cacheKey, cacheTime, retryCount, retryDelay]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    clearCache,
    clearAllCache
  };
};
