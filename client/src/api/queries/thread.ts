import { ForumThread, ThreadReply } from "@/lib/types";
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

// Fetch single thread by ID
export const fetchThreadById = async (threadId: string, userId?: string) => {
  const response = await fetch(
    `/api/threads/id/${threadId}${userId ? `?userId=${userId}` : ""}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch thread: ${response.statusText}`);
  }
  return response.json() as Promise<ForumThread>;
};

// Fetch thread replies
export const fetchThreadReplies = async (threadId: string) => {
  const response = await fetch(`/api/threads/${threadId}/replies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch replies: ${response.statusText}`);
  }
  return response.json() as Promise<ThreadReply[]>;
};

// Like a thread
export const likeThread = async (threadId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/like`,
    { userId }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Dislike a thread
export const dislikeThread = async (threadId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/dislike`,
    { userId }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Toggle pin status for a thread by user
export const toggleThreadPinByUser = async (threadId: string, userId: string) => {
  const response = await apiRequest(
    "POST", 
    `/api/threads/${threadId}/pinned-by-user`,
    { userId }
  );
  
  if (!response.ok) {
    throw new Error("Failed to pin post");
  }
  
  return response.json();
};

// Mark a thread as Post of the Day
export const potdThread = async (threadId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/potd`,
    { userId }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Submit a reply to a thread
export const submitThreadReply = async (
  threadId: string, 
  userId: string, 
  content: string,
  parentReplyId: string | null
) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/replies`,
    {
      userId,
      content,
      parentReplyId
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Check for the special upgrade required error
    if (errorData.error === "UPGRADE_REQUIRED") {
      throw new Error("UPGRADE_REQUIRED");
    }

    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Like a reply
export const likeReply = async (replyId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/replies/${replyId}/like`,
    { userId }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Dislike a reply
export const dislikeReply = async (replyId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/replies/${replyId}/dislike`,
    { userId }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Delete a thread
export const deleteThread = async (threadId: string, userId: string, role?: string) => {
  const response = await apiRequest(
    "DELETE", 
    `/api/threads/${threadId}`, 
    { userId, role }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Delete a reply
export const deleteReply = async (replyId: string, userId: string, role?: string) => {
  const response = await apiRequest(
    "DELETE", 
    `/api/replies/${replyId}`, 
    { userId, role }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}; 