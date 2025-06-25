import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkPollVote, submitPollVote } from "../queries/poll";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to check if a user has voted in a poll
 */
export function useCheckPollVote(threadId: string, userId?: string) {
  return useQuery({
    queryKey: [`thread-poll-vote-check-${threadId}-${userId}`],
    queryFn: () => checkPollVote(threadId, userId),
    // Only run this query if we have a userId
    enabled: !!userId,
    // Don't refetch on window focus or other automatic triggers
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Cache the result for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Don't retry on failure
    retry: false,
  });
}

/**
 * Enhanced hook to submit a vote for a poll option with toast notifications and state management
 */
export function usePollVote(threadId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVotedOption, setUserVotedOption] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({
      optionId,
      currentUser,
    }: {
      optionId: string;
      currentUser: any;
    }) => submitPollVote({ threadId, optionId, currentUser }),

    onSuccess: (data, variables) => {
      const userId = variables.currentUser?.id;

      // Update local state
      setHasVoted(true);
      setUserVotedOption(variables.optionId);

      // Show success toast
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });

      // Invalidate queries to update data
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });

      // Also update the vote check query cache directly
      queryClient.setQueryData(
        [`thread-poll-vote-check-${threadId}-${userId}`],
        { hasVoted: true, votedOptionId: variables.optionId },
      );
    },

    onError: (error: Error, variables) => {
      const userId = variables.currentUser?.id;

      // If the error message contains "already voted", it means the user has voted
      if (error.message.includes("already voted")) {
        setHasVoted(true);

        // Update the vote check query cache
        queryClient.setQueryData(
          [`thread-poll-vote-check-${threadId}-${userId}`],
          { hasVoted: true },
        );

        toast({
          title: "Already voted",
          description: "You have already voted on this poll",
        });
      } else {
        console.error("Vote error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to record vote",
          variant: "destructive",
        });
      }
    },
  });

  return {
    ...mutation,
    hasVoted,
    userVotedOption,
    setHasVoted,
    setUserVotedOption,
    handleVote: (optionId: string, currentUser: any) => {
      mutation.mutate({ optionId, currentUser });
    },
  };
}
