import react from "react";
import { useState } from "react";
import { useSubmitReply } from "@/api/hooks/threads/replies/useSubmitReply";
import { useToast } from "@/hooks/use-toast";

interface ReplyFormProps {
  threadId: string;
  isLoading: boolean;
  currentUser?: {
    id: string;
    username: string;
    emailAddresses: any[];
    firstName: string;
    lastName: string;
    imageUrl: string;
    emailAddress: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
    publicMetadata?: any;
  };
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
  
  const [replyContent, setReplyContent] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

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

  return (
    <form onSubmit={handleReplySubmit}>
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Replying to{" "}
            <span className="text-ufc-blue">
              {replyingTo.username}
            </span>
          </span>
          <button
            type="button"
            onClick={handleCancelReply}
            disabled={isLoading}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Show upgrade warning for free users */}
      {currentUser?.publicMetadata?.planType === "FREE" && (
        <div className="mb-3 rounded border-l-4 border-yellow-500 bg-gray-800 p-3">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-300">
              You're on a{" "}
              <span className="font-bold text-yellow-500">
                Free Plan
              </span>
              .
              <span className="text-gray-400">
                {" "}
                Upgrade to post replies.
              </span>
            </p>
          </div>
        </div>
      )}

      <textarea
        id="reply-input"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write your reply here..."
        disabled={isLoading}
        className="focus:ring-ufc-blue min-h-[150px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed"
        required
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-3">
        </div>

        <button
          type="submit"
          disabled={isLoading || submitReplyMutation.isPending || !replyContent.trim()}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isLoading || submitReplyMutation.isPending || !replyContent.trim()
              ? "cursor-not-allowed bg-gray-700 text-white opacity-50"
              : "bg-ufc-blue hover:bg-ufc-blue-dark text-black"
          }`}
        >
          {isLoading ? "Loading..." : submitReplyMutation.isPending ? "Posting..." : "Post reply"}
        </button>
      </div>
    </form>
  );
}
