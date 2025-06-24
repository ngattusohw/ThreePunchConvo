import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { toggleThreadPin } from "../../../queries/thread";
import { ForumThread } from "@/lib/types";

interface UsePinThread {
  threadId: string;
  userId?: string;
}

export function usePinThread({ threadId, userId }: UsePinThread) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to pin posts");
      return toggleThreadPin(threadId, userId);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });

      // Get current thread data
      const previousThread = queryClient.getQueryData<ForumThread>([
        `/api/threads/id/${threadId}`,
        userId,
      ]);

      // Optimistically update the UI
      if (previousThread) {
        const isPinned = !previousThread.isPinned;

        queryClient.setQueryData([`/api/threads/id/${threadId}`, userId], {
          ...previousThread,
          isPinned,
        });

        // Update thread in any list views by finding all thread list queries
        const threadQueryKeysToUpdate = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            // Match any query that has /api/threads in the key and isn't a specific thread ID
            return (
              query.queryKey[0] &&
              typeof query.queryKey[0] === "string" &&
              query.queryKey[0].includes("/api/threads") &&
              !query.queryKey[0].includes(`/id/${threadId}`)
            );
          },
        });

        // Update each matching query's data
        threadQueryKeysToUpdate.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData: any) => {
            if (!oldData) return oldData;

            // Handle both regular and pinned threads
            if (oldData.regularThreads) {
              return {
                ...oldData,
                regularThreads: oldData.regularThreads.map(
                  (thread: ForumThread) =>
                    thread.id === threadId ? { ...thread, isPinned } : thread,
                ),
                pinnedThreads:
                  oldData.pinnedThreads?.map((thread: ForumThread) =>
                    thread.id === threadId ? { ...thread, isPinned } : thread,
                  ) || [],
              };
            }

            // Handle case where it's just an array of threads
            if (Array.isArray(oldData)) {
              return oldData.map((thread: ForumThread) =>
                thread.id === threadId ? { ...thread, isPinned } : thread,
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
        description: "Thread pin status updated.",
        variant: "success",
      });

      // Still invalidate queries to ensure eventual consistency
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`, userId],
      });
    },
    onError: (error: any, _, context) => {
      // Revert optimistic update if there was an error
      if (context?.previousThread) {
        queryClient.setQueryData(
          [`/api/threads/id/${threadId}`, userId],
          context.previousThread,
        );
      }

      toast({
        title: "Error",
        description: error.message || "Failed to pin post",
        variant: "destructive",
      });
    },
  });
}
