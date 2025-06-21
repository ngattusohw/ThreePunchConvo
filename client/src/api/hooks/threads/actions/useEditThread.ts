import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteThread, editThread } from "../../../queries/thread";

interface UseEditThreadOptions {
  threadId: string;
  userId?: string;
  title: string;
  content: string;
}

export function useEditThread({ threadId, userId, title, content }: UseEditThreadOptions) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to edit this thread");
      return editThread(threadId, userId, title, content);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Thread edited successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to edit thread",
        variant: "destructive",
      });
    },
  });
} 