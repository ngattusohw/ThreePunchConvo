import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { submitThreadReply } from "../../../queries/thread";

interface UseSubmitReplyOptions {
  threadId: string;
  userId?: string;
  replyContent: string;
  replyingTo: { id: string; username: string } | null;
  setReplyContent: (content: string) => void;
  setReplyingTo: (replyingTo: { id: string; username: string } | null) => void;
  setShowUpgradeModal: (show: boolean) => void;
}

export function useSubmitReply({
  threadId,
  userId,
  replyContent,
  replyingTo,
  setReplyContent,
  setReplyingTo,
  setShowUpgradeModal,
}: UseSubmitReplyOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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
} 