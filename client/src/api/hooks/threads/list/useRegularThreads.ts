import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
        // Append new threads when loading more
        setAllRegularThreads((prev) => [...prev, ...regularThreads]);
      }

      // Check if we have more threads to load
      setHasMore(regularThreads.length >= limit);
    }
  }, [regularThreads, page, limit, isRegularLoading]);

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