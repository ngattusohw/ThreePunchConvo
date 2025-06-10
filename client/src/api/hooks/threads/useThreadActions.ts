import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  likeThread,
  dislikeThread,
  toggleThreadPinByUser,
  deleteThread
} from "../../queries/thread";

interface UseThreadActionsOptions {
  threadId: string;
  userId?: string;
}

export function useThreadActions({ threadId, userId }: UseThreadActionsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle liking a thread
  const likeThreadMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to like posts");
      return likeThread(threadId, userId);
    },
    onSuccess: (data) => {
      const wasLiked = data?.wasLiked;
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: wasLiked ? "You unliked this post" : "You liked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  // Handle disliking a thread
  const dislikeThreadMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to dislike posts");
      return dislikeThread(threadId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "You disliked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike post",
        variant: "destructive",
      });
    },
  });

  // Handle post of the day
  const pinnedByUserThreadMutation = useMutation({
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

  // Add delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: (role?: string) => {
      if (!userId) throw new Error("You must be logged in to delete this thread");
      return deleteThread(threadId, userId, role);
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

  return {
    likeThreadMutation,
    dislikeThreadMutation,
    pinnedByUserThreadMutation,
    deleteThreadMutation,
  };
} 