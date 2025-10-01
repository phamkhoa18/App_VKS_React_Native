// hooks/useArticles.js
import { useState, useEffect, useCallback } from 'react';
import { articles as articlesAPI, handleApiError } from '../services/apiService';

export const useArticles = (initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  // Fetch articles function
  const fetchArticles = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      // Set loading states
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      // Prepare params
      const params = {
        page: pageNum,
        ...initialParams
      };

      // Call API
      const response = await articlesAPI.getAll(params);

      if (response.success) {
        const newArticles = response.data || [];

        // Update data
        if (pageNum === 1 || isRefresh) {
          setData(newArticles);
        } else {
          setData(prev => [...prev, ...newArticles]);
        }

        // Update pagination
        if (response.pagination) {
          setPagination(response.pagination);
          setHasMore(response.pagination.hasNextPage);
          setPage(pageNum);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch articles');
      }

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [initialParams]);

  // Load initial data
  useEffect(() => {
    fetchArticles(1);
  }, [fetchArticles]);

  // Refresh function
  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setError(null);
    fetchArticles(1, true);
  }, [fetchArticles]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !error) {
      fetchArticles(page + 1);
    }
  }, [hasMore, loadingMore, loading, error, page, fetchArticles]);

  // Retry function
  const retry = useCallback(() => {
    setError(null);
    fetchArticles(page === 0 ? 1 : page);
  }, [page, fetchArticles]);

  return {
    // Data
    articles: data,
    pagination,
    
    // Loading states
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    
    // Actions
    refresh,
    loadMore,
    retry,
    refetch: fetchArticles
  };
};

// Specialized hook for latest articles
export const useLatestArticles = (options = {}) => {
  const defaultParams = {
    sort: '-createdAt',
    limit: 20,
    language: 'vi',
    ...options
  };

  return useArticles(defaultParams);
};

// Hook for search
export const useSearchArticles = (query, options = {}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setSearchError(null);

      const response = await articlesAPI.search(searchQuery, options);

      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setSearchError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [options]);

  return {
    searchResults,
    searching,
    searchError,
    search
  };
};