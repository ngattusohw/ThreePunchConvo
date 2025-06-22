import react, { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { formatDate } from "@/lib/utils";
import { useThreadData, useThreadReplies } from "@/api/hooks/threads";
import UserAvatar from "@/components/ui/user-avatar";
import { FORUM_CATEGORIES } from "@/lib/constants";
import ThreadPoll from "@/components/thread/poll";
import UserThreadHeader from "@/components/ui/user-thread-header";
import ThreadActions from "@/components/thread/ThreadActions";
import MediaPreview from "../components/ui/media-preview";
import ReplyForm from "@/components/thread/ReplyForm";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { ThreadReply } from "@/lib/types";
import { useThreadActions } from "@/api/hooks/threads/actions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to format edited date
const formatEditedDate = (editedAt: Date) => {
  const now = new Date();
  const editedDate = new Date(editedAt);
  const diffInMs = now.getTime() - editedDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return editedDate.toLocaleDateString();
  }
};

// Separate component for metadata
function ThreadMetadata({ thread }: { thread: any }) {
  // Get image URL and ensure it's publicly accessible
  const imageUrl = thread?.media?.find(m => m.type === "IMAGE")?.url;
  const fullImageUrl = imageUrl?.startsWith('http') 
    ? imageUrl 
    : imageUrl 
      ? `https://threepunchconvo-production.up.railway.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      : undefined;

  // Debug logging
  console.log('Image URL:', fullImageUrl);

  // Ensure we have a valid URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://threepunchconvo.com';

  // Ensure all values are strings and sanitized
  const title = thread?.title ? String(thread.title).trim() : 'Thread - 3PunchConvo';
  const description = thread?.content ? String(thread.content).substring(0, 200).trim() : 'Check out this thread on ThreePunchConvo';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={currentUrl} />
      {fullImageUrl && <meta property="og:image" content={fullImageUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@3PunchConvo" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {fullImageUrl && <meta name="twitter:image" content={fullImageUrl} />}
    </Helmet>
  );
}


export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user: currentUser } = useMemoizedUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const hasScrolledToReply = useRef(false);

  // Edit state management
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [editedAt, setEditedAt] = useState<Date | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Extract replyId from URL query params once
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const replyId = urlParams.get("replyId");

  const {
    thread,
    isThreadLoading,
    threadError,
    isRepliesLoading,
    repliesError,
    displayReplies,
  } = useThreadData({ 
    threadId: threadId || '',
    userId: currentUser?.id 
  });

  // Initialize edit form when thread data is available
  useEffect(() => {
    if (thread) {
      setContent(thread.content);
      setTitle(thread.title);
      setEditTitle(thread.title);
      setEditContent(thread.content);
    }
  }, [thread]);

  // Thread actions hook for editing
  const { editThreadMutation } = useThreadActions({ 
    threadId: threadId || '', 
    userId: currentUser?.id, 
    title: editTitle, 
    content: editContent 
  });
  
  const {
    replyingTo,
    showUpgradeModal: repliesShowUpgradeModal,
    setShowUpgradeModal: setRepliesShowUpgradeModal,
    likeReplyMutation,
    dislikeReplyMutation,
    deleteReplyMutation,
    handleQuoteReply,
    replyContent,
    setReplyContent,
    setReplyingTo,
    handleReplySubmit,
    submitReplyMutation,
  } = useThreadReplies({
    threadId: threadId || '',
    userId: currentUser?.id
  });

  // Edit handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await editThreadMutation.mutateAsync();
      setIsEditing(false);
    } catch (error) {
      console.error("Error in thread edit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (thread) {
      setContent(thread.content);
      setTitle(thread.title);
      setEditTitle(thread.title);
      setEditContent(thread.content);
    }
    setIsEditing(false);
  };

  const isLoading = isThreadLoading || isRepliesLoading;

  // Scroll to specific reply if replyId is provided in URL query params (only on first load)
  useEffect(() => {
    console.log("Effect triggered - replyId:", replyId, "location:", location);
        
    if (replyId && displayReplies.length > 0 && !isRepliesLoading && !hasScrolledToReply.current) {
      // Function to attempt scrolling to the reply
      const attemptScrollToReply = () => {
        const replyElement = document.getElementById(`reply-${replyId}`);
        
        if (replyElement) {
          // Mark that we've scrolled so it doesn't happen again
          hasScrolledToReply.current = true;
          
          // Add a small delay to ensure the page is fully rendered
          setTimeout(() => {
            replyElement.scrollIntoView({ 
              behavior: "smooth", 
              block: "center" 
            });
            
            // Add a temporary highlight effect
            replyElement.classList.add("ring-2", "ring-ufc-blue", "ring-opacity-50");
            setTimeout(() => {
              replyElement.classList.remove("ring-2", "ring-ufc-blue", "ring-opacity-50");
            }, 2000);
          }, 500);

          // Remove the replyId from the URL after successful scroll
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("replyId");
          setLocation(newUrl.pathname + newUrl.search, { replace: true });
          
          return true; // Element found and scroll initiated
        }
        return false; // Element not found
      };

      // Try immediately first
      if (!attemptScrollToReply()) {
        // If element not found, retry with a small delay
        const retryInterval = setInterval(() => {
          if (attemptScrollToReply()) {
            clearInterval(retryInterval);
          }
        }, 100);

        // Stop retrying after 3 seconds to avoid infinite loops
        setTimeout(() => {
          clearInterval(retryInterval);
        }, 3000);
      }
    }
  }, [replyId, displayReplies.length, isRepliesLoading, setLocation]);

  // Reset the scroll flag when the threadId changes
  useEffect(() => {
    hasScrolledToReply.current = false;
    console.log("Reset scroll flag - threadId:", threadId);
  }, [threadId]);

  // Function to close modal and navigate to upgrade page
  const handleUpgrade = () => {
    setRepliesShowUpgradeModal(false);
    setLocation("/checkout");
  };

  const handleThreadDelete = () => {
    toast({
      title: "Thread deleted",
      description: "The thread has been deleted successfully",
      variant: "success",
    });
    // Redirect to forum
    window.location.href = "/forum";
  };

  // Loading state
  if (isThreadLoading) {
    return (
      <div className="container mx-auto flex justify-center px-4 py-12">
        <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    );
  }

  // Error state
  if (threadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
          <p className="text-red-500">
            Error loading thread:{" "}
            {threadError instanceof Error
              ? threadError.message
              : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  // If no thread data, show error
  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
          <p className="text-red-500">
            Thread not found. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  // Only render metadata when we have thread data
  const metadata = <ThreadMetadata thread={thread} />;

  return (
    <div className="container mx-auto px-4 py-6">
      {metadata}

      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Main Content */}
        <div className="lg:flex-grow">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center text-sm">
            <Link
              href="/forum"
              className="text-gray-400 transition hover:text-white"
            >
              Forum
            </Link>
            <span className="mx-2 text-gray-600">/</span>
            <Link
              href={`/forum/${thread.categoryId}`}
              className="text-gray-400 transition hover:text-white"
            >
              {getCategoryName(thread.categoryId)}
            </Link>
            <span className="mx-2 text-gray-600">/</span>
            <span className="truncate text-white">
              {title.length > 30
                ? title.substring(0, 30) + "..."
                : title}
            </span>
          </div>

          {/* Thread Card */}
          <div className={`bg-dark-gray ${thread.isPinned ? 'border-l-4 border-ufc-blue' : ''} rounded-lg overflow-hidden shadow-lg mb-6`}>
            <div className="p-5">
              {/* Thread Header */}
              <div className="flex items-start">
                <div className="flex-grow">
                  <div className="mb-2">
                    <UserThreadHeader 
                      user={thread.user}
                      createdAt={thread.createdAt}
                      isPinned={thread.isPinned}
                      pinnedPosition="right"
                    />
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          id="edit-title"
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ufc-blue focus:border-transparent"
                          placeholder="Enter thread title..."
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-content" className="block text-sm font-medium text-gray-300 mb-1">
                          Content
                        </label>
                        <textarea
                          id="edit-content"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ufc-blue focus:border-transparent resize-vertical"
                          placeholder="Enter thread content..."
                        />
                      </div>

                      {/* Edit Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-ufc-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <h1 className="mb-4 text-2xl font-bold text-white">
                        {title}
                        {thread.edited && thread.editedAt && (
                          <span className="ml-2 text-sm font-normal text-gray-400">
                            (edited {formatEditedDate(thread.editedAt)})
                          </span>
                        )}
                      </h1>

                      <div className="mb-6 whitespace-pre-line text-gray-300">
                        {content}
                      </div>
                    </>
                  )}

                  {/* Thread Media - only show in view mode */}
                  {!isEditing && thread.media && thread.media.length > 0 && (
                    <div className="mb-6">
                      <MediaPreview
                        media={thread.media[0]}
                        threadTitle={thread.title}
                      />
                    </div>
                  )}

                  {/* Thread Poll - only show in view mode */}
                  {!isEditing && thread?.poll && (
                    <ThreadPoll 
                      key={`poll-${threadId}`}
                      threadId={threadId} 
                      poll={thread.poll} 
                    />
                  )}

                  {/* Thread Actions - only show in view mode */}
                  {!isEditing && (
                    <div className="mb-6">
                      <ThreadActions 
                        thread={thread}
                        onClickEdit={handleEdit}
                        onClickDelete={handleThreadDelete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              Replies ({displayReplies.length})
            </h2>

            {isRepliesLoading ? (
              <div className="py-12 text-center">
                <div className="border-ufc-blue mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2"></div>
                <p className="mt-4 text-gray-400">Loading replies...</p>
              </div>
            ) : repliesError ? (
              <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
                <p className="text-red-500">
                  Error loading replies. Please try again later.
                </p>
              </div>
            ) : displayReplies.length === 0 ? (
              <div className="bg-dark-gray rounded-lg p-8 text-center">
                <p className="text-gray-400">
                  No replies yet. Be the first to reply!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onQuote={handleQuoteReply}
                    likeReplyMutation ={likeReplyMutation}
                    onDislike={() => dislikeReplyMutation.mutate(reply.id.toString())}
                    onDelete={() => deleteReplyMutation.mutate(reply.id.toString())}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reply Form */}
          <div id="reply-form" className="bg-dark-gray rounded-lg p-5">
            <h3 className="mb-4 text-lg font-bold text-white">
              {replyingTo
                ? `Reply to ${replyingTo.username}`
                : "Add Your Reply"}
            </h3>

            {!currentUser ? (
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <p className="mb-3 text-gray-300">
                  You need to be logged in to reply
                </p>
                <Link
                  href="/login"
                  className="bg-ufc-blue hover:bg-ufc-blue-dark inline-block rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                >
                  Log In
                </Link>
              </div>
            ) : (
              <ReplyForm 
                threadId={threadId}
                currentUser={currentUser}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="mt-9 hidden w-80 flex-shrink-0 lg:block">
          <div className="bg-dark-gray sticky top-20 rounded-lg p-4">
            <h3 className="mb-4 text-lg font-bold text-white">Thread Info</h3>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Posted by</p>
              <div className="flex items-center">
                <UserAvatar
                  user={thread.user}
                  size="sm"
                  className="mr-2"
                />
                <Link
                  href={`/user/${thread.user.username}`}
                  className="hover:text-ufc-blue text-white transition"
                >
                  {thread.user.username}
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Category</p>
              <Link
                href={`/forum/${thread.categoryId}`}
                className="text-ufc-blue hover:underline"
              >
                {getCategoryName(thread.categoryId)}
              </Link>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Created</p>
              <p className="text-white">
                {formatDate(thread.createdAt)}
              </p>
            </div>

            {thread.edited && thread.editedAt && (
              <div className="mb-4">
                <p className="mb-1 text-sm text-gray-400">Last edited</p>
                <p className="text-white">
                  {formatDate(thread.editedAt)}
                </p>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {/* <div className="bg-gray-800 p-2 rounded-lg text-center">
                  <span className="block text-ufc-blue font-bold">{thread.viewCount}</span>
                  <span className="text-gray-400 text-xs">Views</span>
                </div> */}
                <div className="rounded-lg bg-gray-800 p-2 text-center">
                  <span className="text-ufc-blue block font-bold">
                    {thread.repliesCount}
                  </span>
                  <span className="text-xs text-gray-400">Replies</span>
                </div>
              </div>
            </div>

            {thread.isPinned && (
              <div className="bg-gray-800 p-3 rounded-lg mb-4">
                <div className="flex items-center text-ufc-blue mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                  </svg>
                  <span className="font-medium">PINNED</span>
                </div>
                <p className="text-gray-300 text-sm">This post has been pinned by an administrator.</p>
              </div>
            )}

            {(currentUser?.publicMetadata?.role as string === "ADMIN" ||
              currentUser?.publicMetadata?.role as string === "MODERATOR") && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <h3 className="mb-2 text-lg font-bold text-white">
                  Moderation
                </h3>
                <div className="space-y-2">
                  <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {thread.isLocked ? "Unlock Thread" : "Lock Thread"}
                  </button>
                  <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {thread.isPinned ? "Unpin Thread" : "Pin Thread"}
                  </button>
                  <button className="bg-ufc-blue hover:bg-ufc-blue-dark flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-black transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Delete Thread
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {repliesShowUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-dark-gray mx-4 w-full max-w-md rounded-lg p-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              Upgrade Required
            </h2>
            <p className="mb-6 text-gray-300">
              You need to upgrade your plan to access this feature.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full rounded-lg bg-ufc-blue py-2 font-medium text-black transition hover:bg-ufc-blue-dark"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setRepliesShowUpgradeModal(false)}
                className="w-full rounded-lg border border-gray-600 bg-transparent py-2 font-medium text-white transition hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get category name
function getCategoryName(categoryId: string): string {
  const category = FORUM_CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.name || "Unknown Category";
}


interface ReplyCardProps {
  reply: ThreadReply & {
    level?: number;
    parentUsername?: string;
  };
  onQuote: (reply: ThreadReply) => void;
  likeReplyMutation: () => void;
  onDislike: () => void;
  onDelete: () => void;
}

function ReplyCard({
  reply,
  onQuote,
  likeReplyMutation,
  onDislike,
  onDelete,
}: ReplyCardProps) {
  const { user: currentUser } = useMemoizedUser();

  // Calculate indentation based on the reply's level in the thread
  const level = reply.level || 0;

  // Use fixed indentation classes based on level
  let indentationClass = "";
  if (level === 1) indentationClass = "ml-4 border-l-2 border-gray-700";
  else if (level === 2)
    indentationClass = "ml-8 border-l-2 border-gray-600";
  else if (level === 3)
    indentationClass = "ml-12 border-l-2 border-gray-600";
  else if (level >= 4)
    indentationClass = "ml-16 border-l-2 border-gray-600";

  const canDeleteReply =
    currentUser &&
    (currentUser.id === reply.userId ||
      (currentUser.publicMetadata?.role as string) === "ADMIN" ||
      (currentUser.publicMetadata?.role as string) === "MODERATOR");

  return (
    <div
      id={`reply-${reply.id}`}
      className={`bg-dark-gray overflow-hidden rounded-lg shadow-lg ${indentationClass} ${level > 0 ? "mt-2" : "mt-4"}`}
    >
      {level > 0 && reply.parentUsername && (
        <div className="flex items-center bg-gray-800 px-4 py-1 text-xs text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          Reply to{" "}
          <span className="text-ufc-blue ml-1 font-medium">
            {reply.parentUsername}
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-grow">
            <div className="mb-2">
              <UserThreadHeader 
                user={reply.user}
                createdAt={reply.createdAt}
                pinnedPosition="inline"
              />
            </div>

            <div className="mb-4 whitespace-pre-line text-gray-300">
              {reply.content}
            </div>

            {/* Reply Media */}
            {reply.media && reply.media.length > 0 && (
              <div className="mb-4">
                <img
                  src={reply.media[0].url}
                  alt={`Media for reply`}
                  className="max-h-72 w-auto rounded-lg"
                />
              </div>
            )}

            {/* Reply Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => likeReplyMutation.mutate(reply.id.toString())}
                disabled={!currentUser || likeReplyMutation.isPending || likeReplyMutation.hasLiked}
                className={`flex items-center ${likeReplyMutation.hasLiked ? 'text-green-500' : 'text-gray-400'} transition ${currentUser && !likeReplyMutation.isPending ? 'hover:text-green-500' : ''} ${likeReplyMutation.isPending ? 'text-green-500 opacity-50' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5"
                  fill="none"
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
                <span className="font-medium">{reply.likesCount}</span>
              </button>

              <button
                onClick={() => {
                  document
                    .getElementById("reply-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                  onQuote(reply);
                }}
                disabled={!currentUser}
                className="ml-auto flex items-center text-gray-400 transition hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span className="font-medium">Reply</span>
              </button>
            </div>

            {canDeleteReply && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this reply? This action cannot be undone.",
                    )
                  ) {
                    onDelete();
                  }
                }}
                className="flex items-center text-gray-400 transition hover:text-red-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5"
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
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
