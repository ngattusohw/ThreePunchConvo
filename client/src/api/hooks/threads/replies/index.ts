import { useSubmitReply } from "./useSubmitReply";
import { useLikeReply } from "./useLikeReply";
import { useDislikeReply } from "./useDislikeReply";
import { useDeleteReply } from "./useDeleteReply";
import { useReplyState } from "./useReplyState";

interface UseThreadRepliesOptions {
  threadId: string;
  userId?: string;
}

export function useThreadReplies({ threadId, userId }: UseThreadRepliesOptions) {
  const {
    replyContent,
    setReplyContent,
    replyingTo,
    setReplyingTo,
    showUpgradeModal,
    setShowUpgradeModal,
    handleQuoteReply,
  } = useReplyState();

  const submitReplyMutation = useSubmitReply({
    threadId,
    userId,
    replyContent,
    replyingTo,
    setReplyContent,
    setReplyingTo,
    setShowUpgradeModal,
  });

  const likeReplyMutation = useLikeReply({ threadId, userId });
  const dislikeReplyMutation = useDislikeReply({ threadId, userId });
  const deleteReplyMutation = useDeleteReply({ threadId, userId });

  // Handle replying to a thread
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReplyMutation.mutate();
  };

  return {
    replyContent,
    setReplyContent,
    replyingTo,
    setReplyingTo,
    showUpgradeModal,
    setShowUpgradeModal,
    submitReplyMutation,
    likeReplyMutation,
    dislikeReplyMutation,
    deleteReplyMutation,
    handleQuoteReply,
    handleReplySubmit,
  };
} 