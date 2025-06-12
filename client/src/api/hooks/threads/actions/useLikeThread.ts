import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { likeThread } from "../../../queries/thread";
import { ForumThread } from "@/lib/types";

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
    onSuccess: (data, _, context) => {
      // Get the current like state from thread lists
      let currentHasLiked = false;
      let currentLikesCount = 0;
      
      // Try to find the thread in all thread-related queries
      const allQueries = queryClient.getQueryCache().findAll();
      
      for (const query of allQueries) {
        const data = queryClient.getQueryData(query.queryKey);
        if (Array.isArray(data)) {
          const threadInList = data.find((t: ForumThread) => t.id === threadId);
          if (threadInList) {
            currentHasLiked = threadInList.hasLiked;
            currentLikesCount = threadInList.likesCount;
            break;
          }
        }
      }
      
      const hasLiked = !currentHasLiked;
      const likesCount = hasLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

      // Update thread detail if it exists
      const previousThread = queryClient.getQueryData<ForumThread>([`/api/threads/id/${threadId}`, userId]);
      if (previousThread) {
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          hasLiked,
          likesCount,
        });
      }

      // Update all thread list queries that contain the thread
      const threadQueryKeysToUpdate = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          // Only update queries for thread lists (not thread detail)
          return (
            query.queryKey[0] &&
            typeof query.queryKey[0] === 'string' &&
            query.queryKey[0].startsWith('/api/threads/') &&
            !query.queryKey[0].includes('/id/')
          );
        }
      });

      threadQueryKeysToUpdate.forEach(query => {
        queryClient.setQueryData(query.queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          
          // Update the thread in the array
          return oldData.map((thread: ForumThread) =>
            thread.id === threadId
              ? { ...thread, hasLiked, likesCount }
              : thread
          );
        });
      });

      // Toast notification for success
      const wasLiked = data?.wasLiked;
      
      toast({
        title: "Success",
        description: wasLiked ? "You unliked this post" : "You liked this post",
      });
      
      // We still invalidate to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });
    },
    onError: (error: Error, _, context) => {
      // Don't apply any optimistic updates on error
      // The UI will remain in its current state
      
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });
} 