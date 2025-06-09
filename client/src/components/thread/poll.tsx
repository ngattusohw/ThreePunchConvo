import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Poll } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ThreadPollProps {
  threadId: string;
  poll: Poll;
}

function PollSkeleton() {
  return (
    <div className="mb-6 rounded-lg bg-gray-800 p-4 animate-pulse">
      <div className="h-5 bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3">
            <div className="h-8 bg-gray-700 rounded mb-1"></div>
          </div>
        ))}
      </div>
      <div className="h-4 bg-gray-700 rounded w-1/3 mt-4"></div>
    </div>
  );
}

export default function ThreadPoll({ threadId, poll }: ThreadPollProps) {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVotedOption, setUserVotedOption] = useState<string | null>(null);
  const [isCheckingVote, setIsCheckingVote] = useState(true);
  const isPollExpired = new Date() > new Date(poll.expiresAt);
  
  // Check if user has already voted by checking with the backend
  useEffect(() => {
    if (!currentUser || !poll) {
      setIsCheckingVote(false);
      return;
    }
    
    // Function to check if user has voted on this poll
    const checkUserVote = async () => {
      setIsCheckingVote(true);
      try {
        // We can check if the server returned an error when trying to vote
        // This is a way to determine if the user has already voted
        const response = await apiRequest(
          "POST",
          `/api/threads/${threadId}/poll/${poll.options[0].id}/vote`,
          {
            userId: currentUser.id,
          }
        );
        
        const data = await response.json();
        
        // If the response indicates user already voted
        if (!response.ok && data.message?.includes("already voted")) {
          setHasVoted(true);
          // If the response contains which option was voted for
          if (data.optionId) {
            setUserVotedOption(data.optionId);
          }
        }
      } catch (error) {
        // If there's an error mentioning "already voted", it means the user has voted
        if (error instanceof Error && error.message.includes("already voted")) {
          setHasVoted(true);
          // Try to extract optionId from error message if available
          const match = error.message.match(/option\s+id\s*:\s*([a-zA-Z0-9-_]+)/i);
          if (match && match[1]) {
            setUserVotedOption(match[1]);
          }
        }
      } finally {
        setIsCheckingVote(false);
      }
    };
    
    checkUserVote();
  }, [currentUser, poll, threadId]);

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
    onSuccess: (data, optionId) => {
      setHasVoted(true);
      setUserVotedOption(optionId);
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: Error) => {
      // If the error message contains "already voted", it means the user has voted
      if (error.message.includes("already voted")) {
        setHasVoted(true);
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

  const shouldShowResults = hasVoted || isPollExpired || !currentUser;
  const isLoading = isCheckingVote || submitPollVoteMutation.isPending;
  
  if (isLoading) {
    return <PollSkeleton />;
  }
  
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
                        option.id === userVotedOption 
                          ? "bg-[#f5c518]" // Gold for user's vote
                          : Number(option.id.charAt(option.id.length - 1)) % 2 === 0 
                            ? "bg-blue-500" 
                            : "bg-green-500" // Green instead of red
                      }`}
                    />
                  </div>
                </div>
              ) : (
                // Show voting buttons - using a custom button instead of the Button component
                <button
                  onClick={() => submitPollVoteMutation.mutate(option.id)}
                  disabled={submitPollVoteMutation.isPending}
                  className={cn(
                    "w-full mb-2 py-2 px-4 rounded-md text-left",
                    "bg-gray-700 text-white font-medium",
                    "hover:bg-[#f5c518] hover:text-black",
                    "focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-opacity-50",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {option.text}
                </button>
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
