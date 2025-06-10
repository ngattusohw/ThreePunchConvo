import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteReply } from "../../../queries/thread";

interface UseDeleteReplyOptions {
  threadId: string;
  userId?: string;
}

export function useDeleteReply({ threadId, userId }: UseDeleteReplyOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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
} 