import { useState } from "react";
import { useSubmitReply } from "@/api/hooks/threads/replies/useSubmitReply";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { useLocation } from "wouter";
import { MemoizedUser } from "@/hooks/useMemoizedUser";

interface ReplyFormProps {
  threadId: string;
  isLoading: boolean;
  currentUser?: MemoizedUser;
  replyingTo: { id: string; username: string } | null;
  setReplyingTo: (replyingTo: { id: string; username: string } | null) => void;
}

// Create a separate ReplyForm component
export default function ReplyForm({
  threadId,
  currentUser,
  replyingTo,
  setReplyingTo,
  isLoading,
}: ReplyFormProps) {
  console.log("currentUser: ", currentUser);
  const { hasPaidPlan, isPlanLoading } = useUserProfile(currentUser?.username);
  const [location, setLocation] = useLocation();

  const [replyContent, setReplyContent] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = () => {
    // Keep the modal open until we navigate to avoid 404 flash
    // Use setTimeout to let the current event loop complete before navigation
    setLocation("/checkout", { replace: true });
  };

  // Use the submit reply hook directly
  const submitReplyMutation = useSubmitReply({
    threadId,
    userId: currentUser?.id,
    replyContent,
    replyingTo,
    setReplyContent,
    setReplyingTo,
    setShowUpgradeModal,
  });

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  // Handle form submission
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission when loading
    submitReplyMutation.mutate();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior (like adding new line)

      // Check if the form can be submitted
      const canSubmit =
        !isLoading &&
        !submitReplyMutation.isPending &&
        replyContent.trim() &&
        !isPlanLoading &&
        hasPaidPlan;

      if (canSubmit) {
        submitReplyMutation.mutate();
      }
    }
  };

  return (
    <form onSubmit={handleReplySubmit}>
      {replyingTo && (
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-sm text-gray-400'>
            Replying to{" "}
            <span className='text-ufc-blue'>{replyingTo.username}</span>
          </span>
          <button
            type='button'
            onClick={handleCancelReply}
            disabled={isLoading}
            className='text-sm text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
          >
            Cancel
          </button>
        </div>
      )}

      {/* Show upgrade warning for free users */}
      {!hasPaidPlan && (
        <div className='mb-3 rounded border-l-4 border-yellow-500 bg-gray-800 p-3'>
          <div className='flex items-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='mr-2 h-5 w-5 text-yellow-500'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
            <p className='text-sm text-gray-300'>
              You're on a{" "}
              <span className='font-bold text-yellow-500'>Free Plan</span>.
              <span className='text-gray-400'> Upgrade to post replies.</span>
            </p>
          </div>
        </div>
      )}

      <textarea
        id='reply-input'
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Write your reply here...'
        disabled={isLoading || isPlanLoading}
        className='focus:ring-ufc-blue min-h-[150px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50'
        required
      />

      <div className='mt-4 flex items-center justify-end'>
        <div className='flex space-x-3'>
          {!hasPaidPlan && (
            <button
              onClick={handleUpgrade}
              className='bg-ufc-blue hover:bg-ufc-blue-dark rounded-lg px-4 py-2 text-sm font-medium transition'
            >
              Upgrade Now
            </button>
          )}
          <button
            type='submit'
            disabled={
              isLoading ||
              submitReplyMutation.isPending ||
              !replyContent.trim() ||
              isPlanLoading ||
              !hasPaidPlan
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isLoading ||
              submitReplyMutation.isPending ||
              !replyContent.trim() ||
              isPlanLoading ||
              !hasPaidPlan
                ? "cursor-not-allowed bg-gray-700 text-white opacity-50"
                : "bg-ufc-blue hover:bg-ufc-blue-dark text-black"
            }`}
          >
            {isLoading
              ? "Loading..."
              : submitReplyMutation.isPending
                ? "Posting..."
                : "Post reply"}
          </button>
        </div>
      </div>
    </form>
  );
}
