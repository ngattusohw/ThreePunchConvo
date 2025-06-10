import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForumThread } from '@/lib/types';
import { fetchPinnedThreads, fetchRegularThreads } from '../queries/thread';

interface UseThreadsOptions {
  category: string;
  initialFilterOption?: "recent" | "popular" | "new";
  initialTimeRange?: "all" | "week" | "month" | "year";
  limit?: number;
}

export function useThreads({
  category,
  initialFilterOption = "recent",
  initialTimeRange = "all",
  limit = 10
}: UseThreadsOptions) {
  const [filterOption, setFilterOption] = useState<"recent" | "popular" | "new">(initialFilterOption);
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">(initialTimeRange);
  const [page, setPage] = useState(0);
  const [allRegularThreads, setAllRegularThreads] = useState<ForumThread[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Query for Pinned threads
  const { 
    data: pinnedThreads = [], 
    isLoading: isPinnedLoading 
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, 'pinned'],
    queryFn: () => fetchPinnedThreads(category),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  
  // Query for regular threads (non-pinned)
  const { 
    data: regularThreads = [], 
    isLoading: isRegularLoading,
    error,
    refetch: refetchRegularThreads,
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, filterOption, timeRange, page],
    queryFn: () => fetchRegularThreads(category, filterOption, timeRange, page, limit),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data always stale to force refetch
  });

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

  // Helper function to handle filter changes
  const handleFilterChange = (newFilter: "recent" | "popular" | "new") => {
    if (newFilter === filterOption) {
      // If clicking the same filter, force a refresh
      setAllRegularThreads([]);
      setPage(0);
      setHasMore(true);
      setTimeout(() => {
        refetchRegularThreads();
      }, 0);
    } else {
      setFilterOption(newFilter);
    }
  };

  // Helper function to handle time range changes
  const handleTimeRangeChange = (newTimeRange: "all" | "week" | "month" | "year") => {
    if (newTimeRange === timeRange) {
      // If selecting the same time range, force a refresh
      setAllRegularThreads([]);
      setPage(0);
      setHasMore(true);
      setTimeout(() => {
        refetchRegularThreads();
      }, 0);
    } else {
      setTimeRange(newTimeRange);
    }
  };

  // Load more threads
  const loadMore = () => {
    if (hasMore && !isRegularLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return {
    pinnedThreads,
    regularThreads: allRegularThreads,
    isLoading: isPinnedLoading || isRegularLoading,
    error,
    filterOption,
    timeRange,
    hasMore,
    page,
    loadMore,
    handleFilterChange,
    handleTimeRangeChange,
  };
} 