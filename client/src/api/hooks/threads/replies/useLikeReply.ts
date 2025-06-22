import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { likeReply } from "../../../queries/thread";
import { Reply } from "@shared/schema";

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
      let currentHasLiked = false;
      let currentLikesCount = 0;
      const allQueries = queryClient.getQueryCache().findAll();


      for (const query of allQueries) {
        const data = queryClient.getQueryData(query.queryKey);
        if (Array.isArray(data)) {
          const replyinList = data.find((t: Reply) => t.id === replyId);
          if (replyinList) {
            currentHasLiked = replyinList.hasLiked;
            currentLikesCount = replyinList.likesCount;
            break;
          }
        }
      }

      const hasLiked = !currentHasLiked;
      const likesCount = hasLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

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