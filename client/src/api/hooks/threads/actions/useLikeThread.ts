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
      console.log("LIKE: Starting like mutation for thread:", threadId, "userId:", userId);
      return likeThread(threadId, userId);
    },
    onMutate: async () => {
      console.log("LIKE: onMutate started");
      
      // Cancel any outgoing refetches for this specific thread
      await queryClient.cancelQueries({ queryKey: [`/api/threads/id/${threadId}`, userId] });

      // Optimistically update the thread detail
      const previousThread = queryClient.getQueryData<ForumThread>([`/api/threads/id/${threadId}`, userId]);
      console.log("LIKE: Previous thread data:", previousThread);
      
      // Get the current like state from thread lists if thread detail is not available
      let currentHasLiked = false;
      let currentLikesCount = 0;
      
      if (previousThread) {
        currentHasLiked = previousThread.hasLiked;
        currentLikesCount = previousThread.likesCount;
      } else {
        // Try to find the thread in thread lists to get current state
        const allQueries = queryClient.getQueryCache().findAll();
        console.log("LIKE: All queries in cache:", allQueries.map(q => q.queryKey));
        
        for (const query of allQueries) {
          const data = queryClient.getQueryData(query.queryKey);
          if (Array.isArray(data)) {
            const threadInList = data.find((t: ForumThread) => t.id === threadId);
            if (threadInList) {
              currentHasLiked = threadInList.hasLiked;
              currentLikesCount = threadInList.likesCount;
              console.log(`LIKE: Found thread in list, current state: hasLiked=${currentHasLiked}, likesCount=${currentLikesCount}`);
              break;
            }
          }
        }
      }
      
      const hasLiked = !currentHasLiked;
      const likesCount = hasLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

      console.log(`LIKE: Updating thread ${threadId} - hasLiked: ${hasLiked}, likesCount: ${likesCount}`);

      // Update thread detail if it exists
      if (previousThread) {
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          hasLiked,
          likesCount,
        });
      }

      // Update all thread list queries that are arrays of threads
      const allQueries = queryClient.getQueryCache().findAll();
      console.log("LIKE: All queries in cache:", allQueries.map(q => q.queryKey));
      
      const threadQueryKeysToUpdate = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          // Only update queries for thread lists (not thread detail)
          const matches = (
            query.queryKey[0] &&
            typeof query.queryKey[0] === 'string' &&
            query.queryKey[0].startsWith('/api/threads/') &&
            !query.queryKey[0].includes('/id/')
          );
          console.log(`LIKE: Query ${JSON.stringify(query.queryKey)} matches: ${matches}`);
          return matches;
        }
      });

      console.log("LIKE: Found thread list queries to update:", threadQueryKeysToUpdate.map(q => q.queryKey));

      threadQueryKeysToUpdate.forEach(query => {
        const oldData = queryClient.getQueryData(query.queryKey);
        console.log(`LIKE: Updating query ${JSON.stringify(query.queryKey)}, old data:`, oldData);
        
        queryClient.setQueryData(query.queryKey, (oldData: any) => {
          if (!Array.isArray(oldData)) {
            console.log(`LIKE: Query ${JSON.stringify(query.queryKey)} is not an array, skipping`);
            return oldData;
          }
          
          const updatedData = oldData.map((thread: ForumThread) =>
            thread.id === threadId
              ? { ...thread, hasLiked, likesCount }
              : thread
          );
          
          console.log(`LIKE: Updated query ${JSON.stringify(query.queryKey)}, new data:`, updatedData);
          return updatedData;
        });
      });

      return { previousThread };
    },
    onSuccess: (data, _, context) => {
      // Toast notification for success
      const wasLiked = data?.wasLiked;
      console.log(`LIKE: Success response:`, data);
      
      toast({
        title: "Success",
        description: wasLiked ? "You unliked this post" : "You liked this post",
      });
      
      // We still invalidate to ensure data consistency
      console.log(`LIKE: Invalidating query for thread ${threadId}`);
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });
    },
    onError: (error: Error, _, context) => {
      // Revert back to previous data if there was an error
      console.log(`LIKE: Error occurred:`, error);
      
      if (context?.previousThread) {
        console.log(`LIKE: Reverting to previous thread data`);
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], context.previousThread);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });
} 