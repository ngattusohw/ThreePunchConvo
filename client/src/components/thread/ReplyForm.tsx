import react from "react";
import { UserResource } from "@clerk/clerk-react";
import { useThreadReplies } from "@/api/hooks/threads";

interface ReplyFormProps {
  threadId: string;
  currentUser?: UserResource;
  replyingTo: { id: string; username: string } | null;
  setReplyingTo: (replyingTo: { id: string; username: string } | null) => void;
}

// Create a separate ReplyForm component
export default function ReplyForm({ 
  threadId,
  currentUser, 
  replyingTo,
  setReplyingTo
}: ReplyFormProps) {
  // Use the hook locally but with a stable threadId to prevent re-creation
  const {
    replyContent,
    setReplyContent,
    handleReplySubmit,
    submitReplyMutation
  } = useThreadReplies({
    threadId: threadId,
    userId: currentUser?.id
  });

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
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
            className="text-sm text-gray-400 hover:text-white"
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
        className="focus:ring-ufc-blue min-h-[150px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-1"
        required
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-3">
        </div>

        <button
          type="submit"
          disabled={submitReplyMutation.isPending || !replyContent.trim()}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            submitReplyMutation.isPending || !replyContent.trim()
              ? "cursor-not-allowed bg-gray-700 text-white opacity-50"
              : "bg-ufc-blue hover:bg-ufc-blue-dark text-black"
          }`}
        >
          {submitReplyMutation.isPending ? "Posting..." : "Post reply"}
        </button>
      </div>
    </form>
  );
}
