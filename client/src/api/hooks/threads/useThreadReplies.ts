import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ThreadReply } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  submitThreadReply,
  likeReply,
  dislikeReply,
  deleteReply
} from "../../queries/thread";

interface UseThreadRepliesOptions {
  threadId: string;
  userId?: string;
}

export function useThreadReplies({ threadId, userId }: UseThreadRepliesOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle submitting a reply
  const submitReplyMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to reply");
      if (!replyContent.trim()) throw new Error("Reply cannot be empty");

      return submitThreadReply(
        threadId,
        userId,
        replyContent,
        replyingTo?.id || null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Your reply has been posted",
      });
    },
    onError: (error: Error) => {
      // Special handling for the upgrade required error
      if (error.message === "UPGRADE_REQUIRED") {
        setShowUpgradeModal(true);
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  // Handle liking a reply
  const likeReplyMutation = useMutation({
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to like replies");
      return likeReply(replyId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like reply",
        variant: "destructive",
      });
    },
  });

  // Handle disliking a reply
  const dislikeReplyMutation = useMutation({
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to dislike replies");
      return dislikeReply(replyId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike reply",
        variant: "destructive",
      });
    },
  });

  // Add delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to delete this reply");
      return deleteReply(replyId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
      toast({
        title: "Success",
        description: "Reply deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reply",
        variant: "destructive",
      });
    },
  });

  // Handle quoting a reply
  const handleQuoteReply = (reply: ThreadReply) => {
    setReplyingTo({
      id: reply.id.toString(),
      username: reply.user.username,
    });
  };

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