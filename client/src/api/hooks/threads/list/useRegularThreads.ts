import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ForumThread } from '@/lib/types';
import { fetchRegularThreads } from '../../../queries/thread';

interface UseRegularThreadsOptions {
  category: string;
  filterOption: "recent" | "popular" | "new";
  timeRange: "all" | "week" | "month" | "year";
  limit: number;
  userId?: string;
}

export function useRegularThreads({
  category,
  filterOption,
  timeRange,
  limit,
  userId
}: UseRegularThreadsOptions) {
  const [page, setPage] = useState(0);
  const [allRegularThreads, setAllRegularThreads] = useState<ForumThread[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const queryClient = useQueryClient();

  // Query for regular threads (non-pinned)
  const { 
    data: regularThreads = [], 
    isLoading: isRegularLoading,
    error,
    refetch: refetchRegularThreads,
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, filterOption, timeRange, page, userId],
    queryFn: () => fetchRegularThreads(category, filterOption, timeRange, page, limit, userId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data always stale to force refetch
  });

  // Reset page when filter, time range, or user changes
  useEffect(() => {
    setPage(0);
    setAllRegularThreads([]);
    setHasMore(true);
  }, [filterOption, timeRange, userId]);

  // Update allRegularThreads when regularThreads changes
  useEffect(() => {
    if (!regularThreads || isRegularLoading) return;
    
    if (regularThreads) {
      if (page === 0) {
        // Replace all threads when filters change (page is reset to 0)
        setAllRegularThreads(regularThreads);
      } else {
        // Append new threads when loading more, ensuring no duplicates
        setAllRegularThreads((prev) => {
          const existingIds = new Set(prev.map(thread => thread.id));
          const newThreads = regularThreads.filter(thread => !existingIds.has(thread.id));
          return [...prev, ...newThreads];
        });
      }

      // Check if we have more threads to load
      setHasMore(regularThreads.length >= limit);
    }
  }, [regularThreads, page, limit, isRegularLoading]);

  // Subscribe to cache updates to keep local state in sync
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query) {
        const queryKey = event.query.queryKey;
        // Check if this is a thread list query that might affect our data
        if (
          Array.isArray(queryKey) &&
          queryKey[0] &&
          typeof queryKey[0] === 'string' &&
          queryKey[0].startsWith('/api/threads/') &&
          !queryKey[0].includes('/id/')
        ) {
          // Force a re-render by updating the local state with the latest cache data
          const cacheData = queryClient.getQueryData(queryKey);
          if (Array.isArray(cacheData)) {
            setAllRegularThreads(prev => {
              // Update any threads that exist in both arrays
              return prev.map(thread => {
                const updatedThread = cacheData.find(t => t.id === thread.id);
                return updatedThread || thread;
              });
            });
          }
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Load more threads
  const loadMore = () => {
    if (hasMore && !isRegularLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return {
    regularThreads: allRegularThreads,
    isRegularLoading,
    error,
    hasMore,
    page,
    loadMore,
    refetchRegularThreads
  };
} 