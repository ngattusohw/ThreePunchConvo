import { useEffect, useMemo, memo } from "react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { Poll } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCheckPollVote, usePollVote } from "@/api/hooks/usePoll";

interface ThreadPollProps {
  threadId: string;
  poll: Poll;
}

function PollSkeleton() {
  return (
    <div className='mb-6 animate-pulse rounded-lg bg-gray-800 p-4'>
      <div className='mb-4 h-5 w-3/4 rounded bg-gray-700'></div>
      <div className='space-y-3'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='mb-3'>
            <div className='mb-1 h-8 rounded bg-gray-700'></div>
          </div>
        ))}
      </div>
      <div className='mt-4 h-4 w-1/3 rounded bg-gray-700'></div>
    </div>
  );
}

function ThreadPoll({ threadId, poll }: ThreadPollProps) {
  const { user: currentUser } = useMemoizedUser();
  const isPollExpired = useMemo(
    () => new Date() > new Date(poll.expiresAt),
    [poll.expiresAt],
  );

  // Memoize the userId to prevent unnecessary effect runs
  const userId = currentUser?.id;

  // Use the extracted hook to check if user has voted
  const { isLoading: isCheckingVote, data: voteData } = useCheckPollVote(
    threadId,
    userId,
  );

  // Use the enhanced poll vote hook
  const {
    isPending,
    hasVoted,
    userVotedOption,
    setHasVoted,
    setUserVotedOption,
    handleVote,
  } = usePollVote(threadId);

  // Update local state when vote data changes
  useEffect(() => {
    if (voteData) {
      setHasVoted(voteData.hasVoted || false);
      setUserVotedOption(voteData.votedOptionId || null);
    }
  }, [voteData, setHasVoted, setUserVotedOption]);

  // Memoize these calculations to avoid re-renders
  const shouldShowResults = useMemo(
    () => hasVoted || isPollExpired || !currentUser,
    [hasVoted, isPollExpired, currentUser],
  );

  const isLoading = isCheckingVote || isPending;

  if (isLoading) {
    return <PollSkeleton />;
  }

  return (
    <div className='mb-6 rounded-lg bg-gray-800 p-4'>
      <h3 className='mb-4 font-medium text-white'>{poll.question}</h3>
      <div className='space-y-3'>
        {poll.options.map((option) => {
          const percentage = poll.votesCount
            ? Math.round((option.votesCount / poll.votesCount) * 100)
            : 0;

          return (
            <div key={option.id} className='relative'>
              {shouldShowResults ? (
                // Show results view
                <div className='mb-3'>
                  <div className='mb-1 flex items-center justify-between'>
                    <span className='text-sm text-gray-300'>{option.text}</span>
                    <span className='text-sm text-gray-300'>{percentage}%</span>
                  </div>
                  <div className='flex h-2 overflow-hidden rounded bg-gray-700 text-xs'>
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none ${
                        option.id === userVotedOption
                          ? "bg-[#f5c518]" // Gold for user's vote
                          : "bg-blue-500"
                      }`}
                    />
                  </div>
                </div>
              ) : (
                // Show voting buttons - using a custom button instead of the Button component
                <button
                  onClick={() => handleVote(option.id, currentUser)}
                  disabled={isPending}
                  className={cn(
                    "mb-2 w-full rounded-md px-4 py-2 text-left",
                    "bg-gray-700 font-medium text-white",
                    "hover:bg-[#f5c518] hover:text-black",
                    "focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-opacity-50",
                    "transition-colors duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className='mt-4 text-xs text-gray-400'>
        {poll.votesCount} votes •
        {isPollExpired
          ? " Poll ended"
          : ` ${Math.ceil(
              (new Date(poll.expiresAt).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )} days left`}
      </p>

      {!currentUser && (
        <p className='mt-2 text-xs text-gray-500'>
          You must be logged in to vote
        </p>
      )}
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(ThreadPoll);
