import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchThreadReplies } from "../../../queries/thread";

interface UseGetMoreRepliesOptions {
  threadId: string;
  userId?: string;
  offset: number;
  limit: number;
}

export function useGetMoreReplies({
  threadId,
  userId,
  offset,
  limit,
}: UseGetMoreRepliesOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("offset: ", offset);
  console.log("limit: ", limit);

  return useMutation({
    mutationFn: () => {
      if (!userId)
        throw new Error("You must be logged in to delete this reply");
      return fetchThreadReplies(threadId, userId, limit, offset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`, userId, offset, limit],
      });
      toast({
        title: "Success",
        description: "More replies loaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load more replies",
        variant: "destructive",
      });
    },
  });
}
