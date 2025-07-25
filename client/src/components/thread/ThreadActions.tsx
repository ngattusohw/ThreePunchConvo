import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { ForumThread } from "@/lib/types";
import { useThreadActions } from "@/api/hooks/threads";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import PopupMenu from "./PopupMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ThreadActionsProps {
  thread: ForumThread;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClickEdit?: () => void;
  onClickDelete?: () => void;
}

export default function ThreadActions({
  thread,
  size = "md",
  className = "",
  onClickEdit,
  onClickDelete,
}: ThreadActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareSubmenuOpen, setIsShareSubmenuOpen] = useState(false);
  const { toast } = useToast();
  const { user: clerkUser } = useMemoizedUser();
  const { user: currentUser } = useUserProfile(clerkUser?.username || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    likeThreadMutation,
    potdThreadMutation,
    pinnedByUserThreadMutation,
    deleteThreadMutation,
  } = useThreadActions({
    threadId: thread.id || "",
    userId: clerkUser?.id,
  });

  // Determine icon sizes based on the size prop
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  const canDeleteThread =
    currentUser &&
    (currentUser.id === thread?.userId ||
      currentUser.role === "ADMIN" ||
      currentUser.role === "MODERATOR");

  const canEditThread = currentUser && currentUser.id === thread?.userId;

  // Check if user is admin for pinned functionality
  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".menu-container")) {
        setIsMenuOpen(false);
        setIsShareSubmenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    const baseUrl = window.location.origin;
    const threadUrl = `${baseUrl}/thread/${thread.id}`;
    const tweetText = encodeURIComponent(
      `Check out this 3PunchConvo thread: ${thread.title}`,
    );
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(threadUrl)}`;
    window.open(tweetUrl, "_blank");
    setIsShareSubmenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Like button */}
      <button
        onClick={() => likeThreadMutation.mutate()}
        disabled={
          !currentUser || likeThreadMutation.isPending || thread.hasLiked
        }
        className={`flex items-center ${thread.hasLiked ? "text-green-500" : "text-gray-400"} transition ${currentUser && !likeThreadMutation.isPending ? "hover:text-green-500" : ""} ${likeThreadMutation.isPending ? "text-green-500 opacity-50" : ""}`}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={`mr-1 ${iconSize}`}
          fill={thread.hasLiked ? "currentColor" : "none"}
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5'
          />
        </svg>
        <span className={`font-medium ${textSize}`}>{thread?.likesCount}</span>
      </button>

      {/* Post of the Day button */}
      <button
        onClick={() => {
          potdThreadMutation.mutate();
        }}
        disabled={
          !currentUser || thread.hasPotd || potdThreadMutation.isPending
        }
        className={`flex items-center ${thread.hasPotd ? "text-yellow-500" : "text-gray-400"} transition ${currentUser && !potdThreadMutation.isPending ? "hover:text-yellow-500" : ""}`}
        title='Mark as Post of the Day (once per day)'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={`mr-1 ${iconSize} ${potdThreadMutation.isPending ? "animate-spin" : ""}`}
          fill={thread.hasPotd ? "currentColor" : "none"}
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
          />
        </svg>
        <span className={`font-medium ${textSize}`}>
          {thread.potdCount || 0}
        </span>
      </button>

      {/* Pin button - only show for admins and moderators */}
      {isAdmin && (
        <button
          onClick={() => pinnedByUserThreadMutation.mutate()}
          disabled={!currentUser}
          className={`flex items-center ${thread.isPinned ? "text-ufc-blue" : "text-gray-400"} transition ${currentUser ? "hover:text-ufc-blue" : ""}`}
          title='Pin/Unpin thread (Admin only)'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`${iconSize} mr-1`}
            fill={thread.isPinned ? "currentColor" : "none"}
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z'
            />
          </svg>
        </button>
      )}

      {/* Menu button */}
      <div className='menu-container relative'>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className='flex items-center text-gray-400 transition hover:text-gray-600'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`${iconSize}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
            />
          </svg>
        </button>

        <PopupMenu
          isOpen={isMenuOpen}
          onCopyLink={handleCopyLink}
          onShareOnX={handleShareOnX}
          onEdit={onClickEdit}
          canEditThread={canEditThread}
          canDeleteThread={canDeleteThread}
          onClickDelete={() => setShowDeleteConfirm(true)}
          onClose={() => setIsMenuOpen(false)}
          createdAt={thread.createdAt}
          handleDeleteMutation={deleteThreadMutation.mutate}
        />

        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Thread</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this thread? This action cannot
                be undone and will permanently remove the thread and all its
                content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (onClickDelete) {
                    onClickDelete();
                  } else {
                    deleteThreadMutation.mutate();
                  }
                  setShowDeleteConfirm(false);
                }}
                className='bg-red-600 hover:bg-red-700'
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
