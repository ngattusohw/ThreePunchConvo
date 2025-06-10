import { usePinnedThreads } from "./usePinnedThreads";
import { useRegularThreads } from "./useRegularThreads";
import { useThreadsFilters } from "./useThreadsFilters";

interface UseThreadsListOptions {
  category: string;
  initialFilterOption?: "recent" | "popular" | "new";
  initialTimeRange?: "all" | "week" | "month" | "year";
  limit?: number;
}

export function useThreadsList({
  category,
  initialFilterOption = "recent",
  initialTimeRange = "all",
  limit = 10
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
  } = usePinnedThreads({ category });
  
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
    limit
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