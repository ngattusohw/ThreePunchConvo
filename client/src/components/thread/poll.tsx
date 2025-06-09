import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Poll } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ThreadPollProps {
  threadId: string;
  poll: Poll;
}

export default function ThreadPoll({ threadId, poll }: ThreadPollProps) {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  const isPollExpired = new Date() > new Date(poll.expiresAt);

  // Check if user has already voted - this would ideally come from backend
  // For now, we'll track it in local state
  useEffect(() => {
    // Reset the hasVoted state when poll changes
    setHasVoted(false);
  }, [poll.id]);

  // Handle poll vote
  const submitPollVoteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!currentUser) throw new Error("You must be logged in to vote");
      if (!poll) throw new Error("No poll found");

      try {
        // First, ensure the user exists in the backend database
        const userCheckResponse = await apiRequest(
          "POST",
          `/api/users/clerk/${currentUser.id}`,
          {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.emailAddresses?.[0]?.emailAddress,
            profileImageUrl: currentUser.imageUrl,
            username: currentUser.username,
          },
        );

        if (!userCheckResponse.ok) {
          throw new Error("Failed to register user in backend system");
        }

        // Now that we've ensured the user exists, we can proceed with voting
        const response = await apiRequest(
          "POST",
          `/api/threads/${threadId}/poll/${optionId}/vote`,
          {
            userId: currentUser.id,
          },
        );

        // If there's an error, try to get detailed error information
        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          const responseText = await response.text();

          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error("Failed to parse error response as JSON");
          }

          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error("Error in poll vote:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: Error) => {
      console.error("Vote error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const shouldShowResults = hasVoted || isPollExpired || !currentUser;
  
  return (
    <div className="mb-6 rounded-lg bg-gray-800 p-4">
      <h3 className="mb-4 font-medium text-white">{poll.question}</h3>
      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = poll.votesCount
            ? Math.round((option.votesCount / poll.votesCount) * 100)
            : 0;

          return (
            <div key={option.id} className="relative">
              {shouldShowResults ? (
                // Show results view
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-gray-300">{option.text}</span>
                    <span className="text-sm text-gray-300">{percentage}%</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded bg-gray-700 text-xs">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none ${
                        Number(option.id.charAt(option.id.length - 1)) % 2 === 0 ? "bg-blue-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              ) : (
                // Show voting buttons
                <Button
                  onClick={() => submitPollVoteMutation.mutate(option.id)}
                  disabled={submitPollVoteMutation.isPending}
                  className="w-full mb-2 justify-start text-left bg-gray-700 hover:bg-ufc-gold hover:text-ufc-black focus:ring-2 focus:ring-ufc-gold focus:ring-opacity-50 text-white font-medium transition-colors"
                >
                  {option.text}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {poll.votesCount} votes •
        {isPollExpired
          ? " Poll ended"
          : ` ${Math.ceil(
              (new Date(poll.expiresAt).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )} days left`}
      </p>

      {!currentUser && (
        <p className="mt-2 text-xs text-gray-500">
          You must be logged in to vote
        </p>
      )}
    </div>
  );
}
