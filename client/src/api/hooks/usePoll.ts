import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkPollVote, submitPollVote } from "../queries/poll";

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
 * Hook to submit a vote for a poll option
 */
export function usePollVote(threadId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ optionId, currentUser }: { optionId: string, currentUser: any }) => 
      submitPollVote({ threadId, optionId, currentUser }),
    
    onSuccess: (data, variables) => {
      const userId = variables.currentUser?.id;
      
      // Invalidate queries to update data
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      
      // Also update the vote check query cache directly
      queryClient.setQueryData(
        [`thread-poll-vote-check-${threadId}-${userId}`], 
        { hasVoted: true, votedOptionId: variables.optionId }
      );
    },
  });
} 