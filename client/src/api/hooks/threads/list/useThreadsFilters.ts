import { useState } from "react";

interface UseThreadsFiltersOptions {
  initialFilterOption: "recent" | "popular" | "new";
  initialTimeRange: "all" | "week" | "month" | "year";
}

export function useThreadsFilters({
  initialFilterOption,
  initialTimeRange,
}: UseThreadsFiltersOptions) {
  const [filterOption, setFilterOption] = useState<
    "recent" | "popular" | "new"
  >(initialFilterOption);
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">(
    initialTimeRange,
  );

  // Helper function to handle filter changes
  const handleFilterChange = (newFilter: "recent" | "popular" | "new") => {
    if (newFilter === filterOption) {
      // If clicking the same filter, force a refresh
      // This will be handled by the parent hook
      setTimeout(() => {
        setFilterOption((prev) => {
          if (prev === newFilter) {
            // Toggle to force a refresh
            return "new" === prev ? "recent" : "new";
          }
          return prev;
        });
        setTimeout(() => {
          setFilterOption(newFilter);
        }, 0);
      }, 0);
    } else {
      setFilterOption(newFilter);
    }
  };

  // Helper function to handle time range changes
  const handleTimeRangeChange = (
    newTimeRange: "all" | "week" | "month" | "year",
  ) => {
    if (newTimeRange === timeRange) {
      // If selecting the same time range, force a refresh
      // This will be handled by the parent hook
      setTimeout(() => {
        setTimeRange((prev) => {
          if (prev === newTimeRange) {
            // Toggle to force a refresh
            return "all" === prev ? "week" : "all";
          }
          return prev;
        });
        setTimeout(() => {
          setTimeRange(newTimeRange);
        }, 0);
      }, 0);
    } else {
      setTimeRange(newTimeRange);
    }
  };

  return {
    filterOption,
    timeRange,
    handleFilterChange,
    handleTimeRangeChange,
  };
}
