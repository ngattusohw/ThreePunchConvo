import { usePinnedThreads } from "./usePinnedThreads";
import { useRegularThreads } from "./useRegularThreads";
import { useThreadsFilters } from "./useThreadsFilters";

interface UseThreadsListOptions {
  category: string;
  initialFilterOption?: "recent" | "popular" | "new";
  initialTimeRange?: "all" | "week" | "month" | "year";
  limit?: number;
  userId?: string;
}

export function useThreadsList({
  category,
  initialFilterOption = "recent",
  initialTimeRange = "all",
  limit = 10,
  userId
}: UseThreadsListOptions) {
  const {
    filterOption,
    timeRange,
    handleFilterChange,
    handleTimeRangeChange
  } = useThreadsFilters({
    initialFilterOption,
    initialTimeRange
  });

  const { 
    pinnedThreads,
    isPinnedLoading 
  } = usePinnedThreads({ category, userId });
  
  const {
    regularThreads,
    isRegularLoading,
    error,
    hasMore,
    page,
    loadMore
  } = useRegularThreads({
    category,
    filterOption,
    timeRange,
    limit,
    userId
  });

  return {
    pinnedThreads,
    regularThreads,
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