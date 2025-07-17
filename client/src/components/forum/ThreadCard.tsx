import React, { useState } from "react";
import { Link } from "wouter";
import { ForumThread } from "@/lib/types";
import { checkIsNormalUser, truncateText } from "@/lib/utils";
import ThreadPoll from "@/components/thread/poll";
import MediaPreview from "@/components/ui/media-preview";
import UserThreadHeader from "@/components/ui/user-thread-header";
import ThreadActions from "@/components/thread/ThreadActions";
import { useThreadActions } from "@/api/hooks/threads/actions";
import { Loader2 } from "lucide-react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { USER_ROLES } from "@/lib/constants";

interface ThreadCardProps {
  thread: ForumThread;
  onDelete?: () => void;
  mainThreadMode?: boolean;
}

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

export default function ThreadCard({
  thread,
  onDelete,
  mainThreadMode = false,
}: ThreadCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);
  const [editContent, setEditContent] = useState(thread.content);
  const [loading, setLoading] = useState(false);
  const [isEdited, setIsEdited] = useState(thread.edited);
  const [editedAt, setEditedAt] = useState(thread.editedAt);
  const [isDeleted, setIsDeleted] = useState(false);
  const { user } = useMemoizedUser();
  const { user: currentUser, isPlanLoading } = useUserProfile(user?.username);

  const { editThreadMutation, deleteThreadMutation } = useThreadActions({
    threadId: thread.id,
    userId: currentUser?.externalId,
    title: editTitle,
    content: editContent,
  });

  const borderColor = thread.isPinned ? "border-ufc-blue" : "";

  const isNormalUser = checkIsNormalUser(currentUser?.role);
  // Check if content should be blurred (free user viewing fighter content)
  const shouldBlurContent =
    isNormalUser &&
    (isPlanLoading ||
      ((!currentUser?.planType || currentUser?.planType === "FREE") &&
        thread.user.role === USER_ROLES.FIGHTER));

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await editThreadMutation.mutateAsync();
      setTitle(editTitle);
      setContent(editContent);
      setIsEdited(true);
      setEditedAt(new Date());
      setIsEditing(false);
    } catch (error) {
      console.error("Error in thread edit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteThreadMutation.mutateAsync();
      setIsDeleted(true);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error in thread deletion:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if deleted
  if (isDeleted) {
    return null;
  }

  const handleUpgrade = () => {
    window.location.href = "/checkout";
  };

  return (
    <div
      className={`bg-dark-gray ${borderColor ? `border-l-4 ${borderColor}` : ""} relative rounded-lg ${mainThreadMode ? "mb-6" : "mb-4"} shadow-lg transition hover:shadow-xl`}
    >
      <div className={`${mainThreadMode ? "p-8" : "p-4"}`}>
        <div className='flex items-start'>
          {/* Thread Content */}
          <div className='w-full min-w-0 max-w-full flex-grow'>
            {/* Thread header with user info */}
            <div className={`${mainThreadMode ? "mb-4" : "mb-2"}`}>
              <UserThreadHeader
                user={thread.user}
                createdAt={thread.createdAt}
                isPinned={thread.isPinned}
                showStatus={true}
                size={mainThreadMode ? "lg" : "md"}
                pinnedPosition='right'
              />
            </div>

            {loading ? (
              <div className='flex h-full items-center justify-center'>
                <Loader2
                  className={`${mainThreadMode ? "h-6 w-6" : "h-4 w-4"} animate-spin`}
                />
              </div>
            ) : isEditing ? (
              // Edit Mode
              <div className={`${mainThreadMode ? "space-y-6" : "space-y-4"}`}>
                <div>
                  <label
                    htmlFor='edit-title'
                    className={`mb-1 block ${mainThreadMode ? "text-base" : "text-sm"} font-medium text-gray-300`}
                  >
                    Title
                  </label>
                  <input
                    id='edit-title'
                    type='text'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`focus:ring-ufc-blue w-full rounded-md border border-gray-600 bg-gray-800 ${mainThreadMode ? "px-4 py-3 text-lg" : "px-3 py-2"} text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2`}
                    placeholder='Enter thread title...'
                  />
                </div>

                <div>
                  <label
                    htmlFor='edit-content'
                    className={`mb-1 block ${mainThreadMode ? "text-base" : "text-sm"} font-medium text-gray-300`}
                  >
                    Content
                  </label>
                  <textarea
                    id='edit-content'
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={mainThreadMode ? 6 : 4}
                    className={`focus:ring-ufc-blue resize-vertical w-full rounded-md border border-gray-600 bg-gray-800 ${mainThreadMode ? "px-4 py-3 text-lg" : "px-3 py-2"} text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2`}
                    placeholder='Enter thread content...'
                  />
                </div>

                {/* Edit Actions */}
                <div className='flex space-x-2'>
                  <button
                    onClick={handleSave}
                    className={`bg-ufc-blue rounded-md ${mainThreadMode ? "px-6 py-3 text-lg" : "px-4 py-2"} text-white transition-colors hover:bg-blue-600`}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`rounded-md bg-gray-600 ${mainThreadMode ? "px-6 py-3 text-lg" : "px-4 py-2"} text-white transition-colors hover:bg-gray-700`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <Link href={`/thread/${thread.id}`} className='block'>
                  <h3
                    className={`hover:text-ufc-blue ${mainThreadMode ? "mb-4 text-3xl" : "mb-2 text-lg"} whitespace-normal break-words font-bold text-white transition`}
                  >
                    {!shouldBlurContent && title}
                    {isEdited && editedAt && (
                      <span
                        className={`ml-2 ${mainThreadMode ? "text-lg" : "text-sm"} font-normal text-gray-400`}
                      >
                        (edited {formatEditedDate(editedAt)})
                      </span>
                    )}
                  </h3>
                </Link>

                {/* Content container with blur and overlay */}
                <div
                  className={`${shouldBlurContent ? "relative" : ""} max-w-full overflow-hidden`}
                >
                  <p
                    className={`${mainThreadMode ? "mb-6 text-lg leading-relaxed" : "mb-4 line-clamp-3"} whitespace-pre-line break-all text-gray-300 ${shouldBlurContent ? "select-none blur-sm" : ""}`}
                  >
                    {shouldBlurContent ? "Premium Content" : content}
                  </p>

                  {/* Thread Poll Preview - only show in view mode */}
                  {thread.poll && !mainThreadMode && (
                    <div
                      className={`mb-4 rounded-lg bg-gray-800 p-3 ${shouldBlurContent ? "select-none blur-sm" : ""}`}
                    >
                      <p className={"mb-2 font-medium text-white"}>
                        {thread.poll.question}
                      </p>
                      <div className={"space-y-2"}>
                        {thread.poll.options.slice(0, 4).map((option) => {
                          const percentage = thread.poll?.votesCount
                            ? Math.round(
                                (option.votesCount / thread.poll.votesCount) *
                                  100,
                              )
                            : 0;

                          return (
                            <div className='relative pt-1' key={option.id}>
                              <div className='mb-1 flex items-center justify-between'>
                                <span className={"text-sm text-gray-300"}>
                                  {option.text}
                                </span>
                                <span className={"text-sm text-gray-300"}>
                                  {percentage}%
                                </span>
                              </div>
                              <div
                                className={
                                  "flex h-2 overflow-hidden rounded bg-gray-700 text-xs"
                                }
                              >
                                <div
                                  style={{ width: `${percentage}%` }}
                                  className='flex flex-col justify-center whitespace-nowrap bg-blue-500 text-center text-white shadow-none'
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {thread.poll.options.length > 4 && (
                        <p
                          className={`mt-1 ${mainThreadMode ? "text-base" : "text-sm"} text-gray-400`}
                        >
                          +{thread.poll.options.length - 4} more options
                        </p>
                      )}

                      <p
                        className={`mt-2 ${mainThreadMode ? "text-sm" : "text-xs"} text-gray-400`}
                      >
                        {thread.poll.votesCount == 1
                          ? "1 vote"
                          : `${thread.poll.votesCount} votes`}{" "}
                        •
                        {new Date() > new Date(thread.poll.expiresAt)
                          ? " Ended"
                          : ` ${Math.ceil((new Date(thread.poll.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`}
                      </p>
                    </div>
                  )}

                  {/* Thread Media Preview - only show in view mode */}
                  {thread.media && thread.media.length > 0 && (
                    <div
                      className={`${mainThreadMode ? "mb-6" : "mb-4"} overflow-hidden rounded-lg ${shouldBlurContent ? "select-none blur-lg" : ""}`}
                    >
                      <MediaPreview
                        media={thread.media[0]}
                        threadTitle={thread.title}
                      />
                      {thread.media.length > 1 && (
                        <div
                          className={`mt-2 flex items-center ${mainThreadMode ? "text-base" : "text-sm"} text-gray-400`}
                        >
                          <svg
                            className={`mr-1 ${mainThreadMode ? "h-5 w-5" : "h-4 w-4"}`}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z'
                            />
                          </svg>
                          +{thread.media.length - 1} more{" "}
                          {thread.media.length === 2 ? "image" : "images"}
                        </div>
                      )}
                    </div>
                  )}

                  {thread.poll && mainThreadMode && (
                    <ThreadPoll
                      key={`poll-${thread.id}`}
                      threadId={thread.id}
                      poll={thread.poll}
                    />
                  )}

                  {/* Premium Content Overlay */}
                  {shouldBlurContent && (
                    <button
                      className='absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50'
                      onClick={handleUpgrade}
                    >
                      <div className='rounded-lg border border-gray-600 bg-gray-900 p-4 text-center shadow-xl'>
                        <div className='mb-2'>
                          <svg
                            className='mx-auto h-8 w-8 text-yellow-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                        <p className='mb-1 text-sm font-medium text-white'>
                          Premium Content
                        </p>
                        <p className='text-xs text-gray-400'>
                          Upgrade to view fighter posts
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Thread Stats and Actions - only show in view mode */}
            {!isEditing && (
              <div className='flex items-center justify-between'>
                {/* Thread reply count */}
                <div
                  className={`flex items-center ${mainThreadMode ? "text-base" : "text-sm"} text-gray-400`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className={`mr-1 ${mainThreadMode ? "h-6 w-6" : "h-5 w-5"}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                    />
                  </svg>
                  {thread.repliesCount} replies
                </div>

                {/* Thread Actions */}
                <ThreadActions
                  thread={thread}
                  onClickEdit={handleEdit}
                  onClickDelete={handleDelete}
                  size={mainThreadMode ? "md" : "sm"}
                  className='ml-2'
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
