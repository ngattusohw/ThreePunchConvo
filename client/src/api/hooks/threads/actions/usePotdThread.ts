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
      return potdThread(threadId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success!",
        description: "You've marked this post as your Post of the Day!",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("already used")) {
        toast({
          title: "Limit Reached",
          description: "You've already used your Post of the Day for today",
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