import { useLikeThread } from "./useLikeThread";
import { useDislikeThread } from "./useDislikeThread";
import { usePinThread } from "./usePinThread";
import { useDeleteThread } from "./useDeleteThread";
import { usePotdThread } from "./usePotdThread";
import { useEditThread } from "./useEditThread";

interface UseThreadActionsOptions {
  threadId: string;
  userId?: string;
  title?: string;
  content?: string;
}

export function useThreadActions({
  threadId,
  userId,
  title,
  content,
}: UseThreadActionsOptions) {
  const likeThreadMutation = useLikeThread({ threadId, userId });
  const dislikeThreadMutation = useDislikeThread({ threadId, userId });
  const pinnedByUserThreadMutation = usePinThread({ threadId, userId });
  const deleteThreadMutation = useDeleteThread({ threadId, userId });
  const potdThreadMutation = usePotdThread({ threadId, userId });
  const editThreadMutation = useEditThread({
    threadId,
    userId,
    title,
    content,
  });

  return {
    likeThreadMutation,
    dislikeThreadMutation,
    pinnedByUserThreadMutation,
    deleteThreadMutation,
    potdThreadMutation,
    editThreadMutation,
  };
}
