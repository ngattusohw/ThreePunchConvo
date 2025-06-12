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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/threads/id/${threadId}`, userId] });
      
      // Get current thread data
      const previousThread = queryClient.getQueryData<ForumThread>([`/api/threads/id/${threadId}`, userId]);
      console.log("LIKE: Previous thread data from cache:", previousThread);
      
      // Optimistically update the UI
      if (previousThread) {
        const hasLiked = !previousThread.hasLiked;
        const likesCount = hasLiked 
          ? previousThread.likesCount + 1 
          : Math.max(0, previousThread.likesCount - 1);
        
        console.log(`LIKE: Optimistically updating thread ${threadId} - hasLiked: ${hasLiked}, likesCount: ${likesCount}`);
        
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          hasLiked,
          likesCount,
        });
        
        // Update thread in any list views by finding all thread list queries
        const threadQueryKeysToUpdate = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            // Match any query that has /api/threads in the key and isn't a specific thread ID
            return (
              query.queryKey[0] &&
              typeof query.queryKey[0] === 'string' &&
              query.queryKey[0].includes('/api/threads') &&
              !query.queryKey[0].includes(`/id/${threadId}`)
            );
          }
        });
        
        console.log("LIKE: Found thread query keys to update:", threadQueryKeysToUpdate.map(q => q.queryKey));
        
        // Update each matching query's data
        threadQueryKeysToUpdate.forEach(query => {
          const oldData = queryClient.getQueryData(query.queryKey);
          console.log(`LIKE: Updating query key ${JSON.stringify(query.queryKey)}, current data:`, oldData);
          
          queryClient.setQueryData(query.queryKey, (oldData: any) => {
            if (!oldData) return oldData;
            
            // Handle both regular and pinned threads
            if (oldData.regularThreads) {
              const updatedData = {
                ...oldData,
                regularThreads: oldData.regularThreads.map((thread: ForumThread) => 
                  thread.id === threadId 
                    ? { ...thread, hasLiked, likesCount } 
                    : thread
                ),
                pinnedThreads: oldData.pinnedThreads?.map((thread: ForumThread) => 
                  thread.id === threadId 
                    ? { ...thread, hasLiked, likesCount } 
                    : thread
                ) || [],
              };
              console.log(`LIKE: Updated regular/pinned threads data:`, updatedData);
              return updatedData;
            }
            
            // Handle case where it's just an array of threads
            if (Array.isArray(oldData)) {
              const updatedData = oldData.map((thread: ForumThread) => 
                thread.id === threadId 
                  ? { ...thread, hasLiked, likesCount } 
                  : thread
              );
              console.log(`LIKE: Updated array data:`, updatedData);
              return updatedData;
            }
            
            return oldData;
          });
        });
      } else {
        console.log(`LIKE: No thread data found in cache for thread ${threadId}`);
      }
      
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