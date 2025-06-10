import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { likeReply } from "../../../queries/thread";

interface UseLikeReplyOptions {
  threadId: string;
  userId?: string;
}

export function useLikeReply({ threadId, userId }: UseLikeReplyOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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
} 