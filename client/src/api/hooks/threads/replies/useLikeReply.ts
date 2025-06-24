import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { likeReply } from "../../../queries/thread";
import { Reply } from "@shared/schema";
import { useState } from "react";

interface UseLikeReplyOptions {
  threadId: string;
  userId?: string;
}

export function useLikeReply({ threadId, userId }: UseLikeReplyOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingReplyId, setPendingReplyId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to like replies");
      setPendingReplyId(replyId); // Set the pending reply ID
      return likeReply(replyId, userId);
    },
    onSuccess: (data, replyId) => {
      setPendingReplyId(null); // Clear pending state

      // Get the current like state from reply lists
      let currentHasLiked = false;
      let currentLikesCount = 0;

      // Try to find the reply in all reply-related queries
      const allQueries = queryClient.getQueryCache().findAll();

      for (const query of allQueries) {
        const data = queryClient.getQueryData(query.queryKey);
        if (Array.isArray(data)) {
          const replyInList = data.find((r: Reply) => r.id === replyId);
          if (replyInList) {
            currentHasLiked = replyInList.hasLiked;
            currentLikesCount = replyInList.likesCount;
            break;
          }
        }
      }

      const hasLiked = !currentHasLiked;
      const likesCount = hasLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

      // Update all reply list queries that contain the reply
      const replyQueryKeysToUpdate = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          // Only update queries for reply lists
          return (
            query.queryKey[0] &&
            typeof query.queryKey[0] === "string" &&
            query.queryKey[0].startsWith("/api/threads/") &&
            query.queryKey[0].includes("/replies")
          );
        },
      });

      replyQueryKeysToUpdate.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Update the reply in the array
          return oldData.map((reply: Reply) =>
            reply.id === replyId ? { ...reply, hasLiked, likesCount } : reply,
          );
        });
      });
    },
    onError: (error: Error) => {
      setPendingReplyId(null); // Clear pending state on error

      // Don't apply any optimistic updates on error
      // The UI will remain in its current state

      toast({
        title: "Error",
        description: error.message || "Failed to like reply",
        variant: "destructive",
      });
    },
  });

  // Return the mutation with a custom isPending function
  return {
    ...mutation,
    isPending: (replyId?: string) => {
      if (replyId) {
        return pendingReplyId === replyId;
      }
      return mutation.isPending;
    },
  };
}
