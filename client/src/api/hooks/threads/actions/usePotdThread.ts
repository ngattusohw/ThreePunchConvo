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
      if (!userId)
        throw new Error(
          "You must be logged in to mark posts as Post of the Day",
        );
      return potdThread(threadId, userId);
    },
    onSuccess: (data, _, context) => {
      console.log("🎉 POTD mutation successful");

      // Get the current thread data to apply optimistic update only on success
      const previousThread = queryClient.getQueryData<ForumThread>([
        `/api/threads/id/${threadId}`,
        userId,
      ]);

      // Get the current POTD state from thread lists if thread detail is not available
      let currentHasPotd = false;
      let currentPotdCount = 0;

      if (previousThread) {
        currentHasPotd = previousThread.hasPotd;
        currentPotdCount = previousThread.potdCount || 0;
        console.log(
          "📊 Found thread in cache - current hasPotd:",
          currentHasPotd,
          "potdCount:",
          currentPotdCount,
        );
      } else {
        // Try to find the thread in thread lists to get current state
        const allQueries = queryClient.getQueryCache().findAll();
        console.log(
          "🔍 Searching thread lists for thread:",
          threadId,
          "Found",
          allQueries.length,
          "queries",
        );

        for (const query of allQueries) {
          const data = queryClient.getQueryData(query.queryKey);
          if (Array.isArray(data)) {
            const threadInList = data.find(
              (t: ForumThread) => t.id === threadId,
            );
            if (threadInList) {
              currentHasPotd = threadInList.hasPotd;
              currentPotdCount = threadInList.potdCount || 0;
              console.log(
                "📊 Found thread in list - current hasPotd:",
                currentHasPotd,
                "potdCount:",
                currentPotdCount,
              );
              break;
            }
          }
        }
      }

      const hasPotd = !currentHasPotd;
      const potdCount = hasPotd
        ? currentPotdCount + 1
        : Math.max(0, currentPotdCount - 1);

      console.log(
        "🔄 Applying optimistic update on success - hasPotd:",
        hasPotd,
        "potdCount:",
        potdCount,
      );

      // Apply optimistic update only on successful response
      if (previousThread) {
        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          hasPotd,
          potdCount,
        });
        console.log("✅ Updated thread detail cache");
      }

      // Update all thread list queries that contain this thread
      const allQueries = queryClient.getQueryCache().findAll();
      let updatedQueries = 0;

      allQueries.forEach((query) => {
        const data = queryClient.getQueryData(query.queryKey);
        if (!data) return;

        // Handle case where it's just an array of threads (pinned threads)
        if (Array.isArray(data)) {
          const updatedData = data.map((thread: ForumThread) =>
            thread.id === threadId ? { ...thread, hasPotd, potdCount } : thread,
          );

          // Only update if there were changes
          if (JSON.stringify(data) !== JSON.stringify(updatedData)) {
            queryClient.setQueryData(query.queryKey, updatedData);
            updatedQueries++;
            console.log("✅ Updated thread list cache:", query.queryKey[0]);
          }
        }
      });

      console.log(
        "🎯 POTD optimistic update applied on success - updated",
        updatedQueries,
        "queries",
      );

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
      console.log("❌ POTD mutation failed:", error.message);

      // Don't apply any optimistic updates on error
      // The UI will remain in its current state

      console.error("POTD mutation error:", error);
      if (
        error.message.includes("already used") ||
        error.message.includes("You've already used your Post of the Day")
      ) {
        toast({
          title: "Daily Limit Reached",
          description:
            "You've already marked a post as Post of the Day today. Try again tomorrow!",
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
