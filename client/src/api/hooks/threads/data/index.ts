import { useThreadBasicData } from "./useThreadBasicData";
import { useThreadRepliesData } from "./useThreadRepliesData";

interface UseThreadDataOptions {
  threadId: string;
  userId?: string;
}

export function useThreadData({ threadId, userId }: UseThreadDataOptions) {
  const {
    thread,
    isLoading: isThreadLoading,
    error: threadError,
  } = useThreadBasicData({ threadId, userId });

  const {
    displayReplies,
    isLoading: isRepliesLoading,
    error: repliesError,
  } = useThreadRepliesData({ threadId, userId });

  return {
    thread,
    isThreadLoading,
    threadError,
    isRepliesLoading,
    repliesError,
    displayReplies,
  };
}
