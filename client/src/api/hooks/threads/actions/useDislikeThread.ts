import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { dislikeThread } from "../../../queries/thread";

interface UseDislikeThreadOptions {
  threadId: string;
  userId?: string;
}

export function useDislikeThread({
  threadId,
  userId,
}: UseDislikeThreadOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to dislike posts");
      return dislikeThread(threadId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "You disliked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike post",
        variant: "destructive",
      });
    },
  });
}
