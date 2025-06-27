import { useThreadBasicData } from "./useThreadBasicData";
import { useThreadRepliesData } from "./useThreadRepliesData";

interface UseThreadDataOptions {
  threadId: string;
  userId?: string;
  pageSize?: number;
}

export function useThreadData({
  threadId,
  userId,
  pageSize = 10,
}: UseThreadDataOptions) {
  const {
    thread,
    isLoading: isThreadLoading,
    error: threadError,
  } = useThreadBasicData({ threadId, userId });

  const {
    displayReplies,
    isLoading: isRepliesLoading,
    error: repliesError,
    hasMore,
    loadMore,
    resetPagination,
    currentPage,
  } = useThreadRepliesData({ threadId, userId, pageSize });

  return {
    thread,
    isThreadLoading,
    threadError,
    isRepliesLoading,
    repliesError,
    displayReplies,
    hasMore,
    loadMore,
    resetPagination,
    currentPage,
  };
}
