import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { potdThread } from "../../../queries/thread";

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
      console.log("POTD mutation starting with userId:", userId, "threadId:", threadId);
      return potdThread(threadId, userId);
    },
    onSuccess: () => {
      console.log("POTD mutation successful, invalidating query for thread:", threadId);
      
      // Get current cache state before invalidation
      const currentCache = queryClient.getQueryData([`/api/threads/id/${threadId}`, userId]);
      console.log("Current thread cache before invalidation:", currentCache);
      
      // Invalidate the query
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });
      
      console.log("POTD success - invalidated query cache");
      
      // Force a refetch to ensure we get fresh data
      queryClient.refetchQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      }).then(() => {
        // Log the updated cache after refetch
        const updatedCache = queryClient.getQueryData([`/api/threads/id/${threadId}`, userId]);
        console.log("Updated thread cache after refetch:", updatedCache);
      });
      
      toast({
        title: "Success!",
        description: "You've marked this post as your Post of the Day!",
      });
    },
    onError: (error: Error) => {
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