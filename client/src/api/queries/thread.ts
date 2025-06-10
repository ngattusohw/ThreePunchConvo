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

// Upload images to Volume and return URLs
export const uploadImages = async (files: File[], getToken: () => Promise<string | null>): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    // Get Clerk token for authentication
    const token = await getToken();
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }
    
    const data = await response.json();
    return data.url;
  });
  
  return Promise.all(uploadPromises);
};

export interface CreateThreadParams {
  title: string;
  content: string;
  categoryId: string;
  userId: string;
  poll?: {
    question: string;
    options: string[];
  };
  media?: Array<{
    type: string;
    url: string;
  }>;
}

export const createThread = async (params: CreateThreadParams) => {
  const response = await apiRequest("POST", "/api/threads", params);

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.error === "UPGRADE_REQUIRED") {
      throw errorData; // Throw the complete error object
    }
    throw new Error(errorData.message || "Failed to create post");
  }

  return response.json();
}; 