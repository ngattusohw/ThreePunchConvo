import { ForumThread } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchPinnedThreads = async (category: string) => {
  const params = new URLSearchParams({
    pinnedByUserFilter: 'only',
    sort: 'recent'
  });
  
  const response = await apiRequest(
    "GET",
    `/api/threads/${category}?${params}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch pinned threads');
  }
  
  return response.json() as Promise<ForumThread[]>;
};

export const fetchRegularThreads = async (
  category: string,
  filterOption: "recent" | "popular" | "new",
  timeRange: "all" | "week" | "month" | "year",
  page: number,
  limit: number
) => {
  const params = new URLSearchParams({
    pinnedByUserFilter: 'exclude',
    sort: filterOption,
    timeRange: timeRange,
    limit: String(limit),
    offset: String(page * limit),
  });
  
  const response = await apiRequest(
    "GET",
    `/api/threads/${category}?${params}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch regular threads");
  }
  
  return response.json() as Promise<ForumThread[]>;
}; 