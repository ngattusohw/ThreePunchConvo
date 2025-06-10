import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { toggleThreadPinByUser } from "../../../queries/thread";

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
      return toggleThreadPinByUser(threadId, userId);
    },
    onSuccess: () => {
      // Invalidate queries to refetch thread and related data
      queryClient.invalidateQueries({ queryKey: [`/api/threads/id/${threadId}`] });
      toast({
        title: "Success!",
        description: "Thread pin status updated.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pin post",
        variant: "destructive",
      });
    },
  });
} 