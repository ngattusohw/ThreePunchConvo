import { useLikeThread } from "./useLikeThread";
import { useDislikeThread } from "./useDislikeThread";
import { usePinThread } from "./usePinThread";
import { useDeleteThread } from "./useDeleteThread"; 
import { usePotdThread } from "./usePotdThread";

interface UseThreadActionsOptions {
  threadId: string;
  userId?: string;
}

export function useThreadActions({ threadId, userId }: UseThreadActionsOptions) {
  const likeThreadMutation = useLikeThread({ threadId, userId });
  const dislikeThreadMutation = useDislikeThread({ threadId, userId });
  const pinnedByUserThreadMutation = usePinThread({ threadId, userId });
  const deleteThreadMutation = useDeleteThread({ threadId, userId });
  const potdThreadMutation = usePotdThread({ threadId, userId });

  return {
    likeThreadMutation,
    dislikeThreadMutation,
    pinnedByUserThreadMutation,
    deleteThreadMutation,
    potdThreadMutation,
  };
} 