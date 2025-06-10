import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { likeThread } from "../../../queries/thread";

interface UseLikeThreadOptions {
  threadId: string;
  userId?: string;
}

export function useLikeThread({ threadId, userId }: UseLikeThreadOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to like posts");
      return likeThread(threadId, userId);
    },
    onSuccess: (data) => {
      const wasLiked = data?.wasLiked;
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: wasLiked ? "You unliked this post" : "You liked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });
} 