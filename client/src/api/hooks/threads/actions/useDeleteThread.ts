import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteThread } from "../../../queries/thread";

interface UseDeleteThreadOptions {
  threadId: string;
  userId?: string;
}

export function useDeleteThread({ threadId, userId }: UseDeleteThreadOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to delete this thread");
      return deleteThread(threadId, userId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Thread deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete thread",
        variant: "destructive",
      });
    },
  });
} 