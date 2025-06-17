import { useUser } from "@clerk/clerk-react";
import { ForumThread } from "@/lib/types";
import { useThreadActions } from "@/api/hooks/threads";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareSubmenuOpen, setIsShareSubmenuOpen] = useState(false);
  const { toast } = useToast();
  
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

  const canEditThread = currentUser && currentUser.id === thread?.userId;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsMenuOpen(false);
        setIsShareSubmenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const threadUrl = `${baseUrl}/thread/${thread.id}`;
    navigator.clipboard.writeText(threadUrl);
    toast({
      title: "Link copied",
      description: "Thread link copied to clipboard",
      variant: "success",
    });
    setIsShareSubmenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleShareOnX = () => {
    const baseUrl = 'https://threepunchconvo-production.up.railway.app';
    const threadUrl = `${baseUrl}/thread/${thread.id}`;
    const tweetText = encodeURIComponent(`Check out this ThreePunchConvo thread: ${thread.title}`);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(threadUrl)}`;
    window.open(tweetUrl, '_blank');
    setIsShareSubmenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Like button */}
      <button
        onClick={()=>likeThreadMutation.mutate()}
        disabled={!currentUser || likeThreadMutation.isPending || thread.hasLiked}
        className={`flex items-center ${thread.hasLiked ? 'text-green-500' : 'text-gray-400'} transition ${currentUser && !likeThreadMutation.isPending ? 'hover:text-green-500' : ''} ${likeThreadMutation.isPending ? 'text-green-500 opacity-50' : ''}`}
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
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
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

      {/* Menu button */}
      <div className="menu-container relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center text-gray-400 hover:text-gray-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${iconSize}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
        </button>

        {/* Popup menu */}
        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-40 rounded-md shadow-lg bg-gray-800 ring-1 ring-gray-700 ring-opacity-5 z-[100]">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy Link
              </button>
              <button
                onClick={handleShareOnX}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>

              {canEditThread && (
                <button
                  onClick={() => {
                    // Add your edit functionality here
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  role="menuitem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 