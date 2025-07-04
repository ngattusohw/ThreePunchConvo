import { ForumThread, ThreadReply } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchPinnedThreads = async (category: string, userId?: string) => {
  const params = new URLSearchParams({
    pinned: "true",
    sort: "recent",
  });

  // Add userId param if available
  if (userId) {
    params.append("userId", userId);
  }

  const response = await apiRequest(
    "GET",
    `/api/threads/${category}?${params}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pinned threads");
  }

  return response.json() as Promise<ForumThread[]>;
};

export const fetchRegularThreads = async (
  category: string,
  filterOption: "recent" | "popular" | "new",
  timeRange: "all" | "week" | "month" | "year",
  page: number,
  limit: number,
  userId?: string,
) => {
  const params = new URLSearchParams({
    pinnedByUserFilter: "exclude",
    sort: filterOption,
    timeRange: timeRange,
    limit: String(limit),
    offset: String(page * limit),
  });

  // Add userId param if available
  if (userId) {
    params.append("userId", userId);
  }

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
export const uploadImages = async (
  files: File[],
  getToken: () => Promise<string | null>,
): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    // Get Clerk token for authentication
    const token = await getToken();

    const response = await fetch("/api/upload", {
      method: "POST",
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
    `/api/threads/id/${threadId}${userId ? `?userId=${userId}` : ""}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch thread: ${response.statusText}`);
  }
  const threadData = await response.json();
  console.log("API thread response:", threadData);
  return threadData as ForumThread;
};

// Fetch thread replies
export const fetchThreadReplies = async (
  threadId: string,
  userId?: string,
  limit?: number,
  offset?: number,
) => {
  const params = new URLSearchParams();
  if (userId) {
    params.append("userId", userId);
  }

  if (limit !== undefined) {
    params.append("limit", limit.toString());
  }
  if (offset !== undefined) {
    params.append("offset", offset.toString());
  }

  const url = `/api/threads/${threadId}/replies${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch replies: ${response.statusText}`);
  }
  return response.json() as Promise<ThreadReply[]>;
};

// Like a thread
export const likeThread = async (threadId: string, userId: string) => {
  const response = await apiRequest("POST", `/api/threads/${threadId}/like`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Dislike a thread
export const dislikeThread = async (threadId: string, userId: string) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/dislike`,
    { userId },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

export const editThread = async (
  threadId: string,
  userId: string,
  title: string,
  content: string,
) => {
  const response = await apiRequest("PUT", `/api/threads/${threadId}`, {
    userId,
    title,
    content,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to edit thread");
  }

  return response.json();
};

// Toggle pin status for a thread (admin only)
export const toggleThreadPin = async (threadId: string, userId: string) => {
  const response = await apiRequest("POST", `/api/threads/${threadId}/pin`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update thread pin status");
  }

  return response.json();
};

// Mark a thread as Post of the Day
export const potdThread = async (threadId: string, userId: string) => {
  const response = await apiRequest("POST", `/api/threads/${threadId}/potd`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Submit a reply to a thread
export const submitThreadReply = async (
  threadId: string,
  userId: string,
  content: string,
  parentReplyId: string | null,
) => {
  const response = await apiRequest(
    "POST",
    `/api/threads/${threadId}/replies`,
    {
      userId,
      content,
      parentReplyId,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Check for the special upgrade required error
    if (errorData.error === "UPGRADE_REQUIRED") {
      throw new Error("UPGRADE_REQUIRED");
    }

    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Like a reply
export const likeReply = async (replyId: string, userId: string) => {
  const response = await apiRequest("POST", `/api/replies/${replyId}/like`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Dislike a reply
export const dislikeReply = async (replyId: string, userId: string) => {
  const response = await apiRequest("POST", `/api/replies/${replyId}/dislike`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Delete a thread
export const deleteThread = async (threadId: string, userId: string) => {
  const response = await apiRequest("DELETE", `/api/threads/${threadId}`, {
    userId,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

// Delete a reply
export const deleteReply = async (
  replyId: string,
  userId: string,
  role?: string,
) => {
  const response = await apiRequest("DELETE", `/api/replies/${replyId}`, {
    userId,
    role,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};
