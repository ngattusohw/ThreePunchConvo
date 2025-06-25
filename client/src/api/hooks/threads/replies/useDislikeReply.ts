import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { dislikeReply } from "../../../queries/thread";

interface UseDislikeReplyOptions {
  threadId: string;
  userId?: string;
}

export function useDislikeReply({ threadId, userId }: UseDislikeReplyOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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
}
