import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { potdThread } from "../../../queries/thread";
import { ForumThread } from "@/lib/types";

interface UsePotdThreadOptions {
  threadId: string;
  userId?: string;
}

export function usePotdThread({ threadId, userId }: UsePotdThreadOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to mark posts as Post of the Day");
      return potdThread(threadId, userId);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/threads/id/${threadId}`, userId] });
      
      // Get current thread data
      const previousThread = queryClient.getQueryData<ForumThread>([`/api/threads/id/${threadId}`, userId]);
      
      // Optimistically update the UI
      if (previousThread) {
        const hasPotd = !previousThread.hasPotd;
        const potdCount = hasPotd 
          ? (previousThread.potdCount || 0) + 1 
          : Math.max(0, (previousThread.potdCount || 0) - 1);
        
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          hasPotd,
          potdCount,
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
        
        // Update each matching query's data
        threadQueryKeysToUpdate.forEach(query => {
          queryClient.setQueryData(query.queryKey, (oldData: any) => {
            if (!oldData) return oldData;
            
            // Handle both regular and pinned threads
            if (oldData.regularThreads) {
              return {
                ...oldData,
                regularThreads: oldData.regularThreads.map((thread: ForumThread) => 
                  thread.id === threadId 
                    ? { ...thread, hasPotd, potdCount } 
                    : thread
                ),
                pinnedThreads: oldData.pinnedThreads?.map((thread: ForumThread) => 
                  thread.id === threadId 
                    ? { ...thread, hasPotd, potdCount } 
                    : thread
                ) || [],
              };
            }
            
            // Handle case where it's just an array of threads
            if (Array.isArray(oldData)) {
              return oldData.map((thread: ForumThread) => 
                thread.id === threadId 
                  ? { ...thread, hasPotd, potdCount } 
                  : thread
              );
            }
            
            return oldData;
          });
        });
      }
      
      return { previousThread };
    },
    onSuccess: (_, __, context) => {
      // Show success toast
      toast({
        title: "Success!",
        description: "You've marked this post as your Post of the Day!",
      });
      
      // Still invalidate queries to ensure eventual consistency
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });
    },
    onError: (error: Error, _, context) => {
      // Revert optimistic update if there was an error
      if (context?.previousThread) {
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], context.previousThread);
      }
      
      console.error("POTD mutation error:", error);
      if (error.message.includes("already used") || error.message.includes("You've already used your Post of the Day")) {
        toast({
          title: "Daily Limit Reached",
          description: "You've already marked a post as Post of the Day today. Try again tomorrow!",
          variant: "destructive",
        });
      } else if (error.message.includes("Thread not found")) {
        toast({
          title: "Post Not Found",
          description: "The post you're trying to mark couldn't be found.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to mark as Post of the Day",
          variant: "destructive",
        });
      }
    },
  });
} 