import { useUser } from "@clerk/clerk-react";
import { ForumThread } from "@/lib/types";
import { useThreadActions } from "@/api/hooks/threads";
import { useEffect } from "react";

interface ThreadActionsProps {
  thread: ForumThread;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ThreadActions({
  thread,
  size = "md",
  className = "",
}: ThreadActionsProps) {
  const { user: currentUser } = useUser();
  
  const {
    likeThreadMutation,
    potdThreadMutation,
    pinnedByUserThreadMutation,
    deleteThreadMutation
  } = useThreadActions({
    threadId: thread.id || '',
    userId: currentUser?.id
  });

  // Determine icon sizes based on the size prop
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  
  const canDeleteThread =
    currentUser &&
    (currentUser.id === thread?.userId ||
      (currentUser.publicMetadata?.role as string) === "ADMIN" ||
      (currentUser.publicMetadata?.role as string) === "MODERATOR");

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <button
        onClick={()=>likeThreadMutation.mutate()}
        disabled={!currentUser || likeThreadMutation.isPending || thread.hasLiked}
        className={`flex items-center ${thread.hasLiked ? 'text-green-500' : 'text-gray-400'} transition ${currentUser && !likeThreadMutation.isPending ? 'hover:text-green-500' : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`mr-1 ${iconSize}`}
          fill={thread.hasLiked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span className={`font-medium ${textSize}`}>
          {thread?.likesCount}
        </span>
      </button>

      {/* Post of the Day button */}
      <button
        onClick={() => {
          potdThreadMutation.mutate();
        }}
        disabled={!currentUser || thread.hasPotd || potdThreadMutation.isPending}
        className={`flex items-center ${thread.hasPotd ? 'text-yellow-500' : 'text-gray-400'} transition ${currentUser && !potdThreadMutation.isPending ? 'hover:text-yellow-500' : ''}`}
        title="Mark as Post of the Day (once per day)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`mr-1 ${iconSize} ${potdThreadMutation.isPending ? 'animate-spin' : ''}`}
          fill={thread.hasPotd ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        <span className={`font-medium ${textSize}`}>
          {thread.potdCount || 0}
        </span>
      </button>

      <button
        onClick={()=>pinnedByUserThreadMutation.mutate()}
        disabled={!currentUser}
        className={`flex items-center ${(thread.isPinnedByUser || thread.isPinned) ? 'text-ufc-blue' : 'text-gray-400'} transition ${currentUser ? 'hover:text-ufc-blue' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg"
          className={`${iconSize} mr-1`}
          fill={(thread.isPinnedByUser || thread.isPinned) ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
        </svg>
      </button>

      {/* Add delete button if user is author or has permission */}
      {canDeleteThread && (
        <button
          onClick={()=>deleteThreadMutation.mutate(thread.id)}
          disabled={!currentUser}
          className="ml-auto flex items-center text-gray-400 transition hover:text-red-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`mr-1 ${iconSize}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className={textSize}>Delete Thread</span>
        </button>
      )}
    </div>
  );
} 