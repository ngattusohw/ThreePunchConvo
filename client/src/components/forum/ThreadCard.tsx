import React, { useState } from "react";
import { Link } from "wouter";
import { ForumThread } from "@/lib/types";
import { truncateText } from "@/lib/utils";
import MediaPreview from "@/components/ui/media-preview";
import UserThreadHeader from "@/components/ui/user-thread-header";
import ThreadActions from "@/components/thread/ThreadActions";
import { useThreadActions } from "@/api/hooks/threads/actions";
import { Loader2 } from "lucide-react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";

interface ThreadCardProps {
  thread: ForumThread;
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

export default function ThreadCard({ thread }: ThreadCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);
  const [editContent, setEditContent] = useState(thread.content);
  const [loading, setLoading] = useState(false);
  const [isEdited, setIsEdited] = useState(thread.edited);
  const [editedAt, setEditedAt] = useState(thread.editedAt);
  const { user: currentUser } = useMemoizedUser();

  const { editThreadMutation } = useThreadActions({ 
    threadId: thread.id, 
    userId: currentUser?.id, 
    title: editTitle, 
    content: editContent 
  });

  const borderColor = thread.isPinned
    ? "border-ufc-gold"
    : "";

  const handleEdit = () => {
    setIsEditing(true);
  }

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
  }

  const handleCancel = () => {
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setIsEditing(false);
  }

  return (
    <div
      className={`bg-dark-gray ${borderColor ? `border-l-4 ${borderColor}` : ""} overflow-hidden rounded-lg shadow-lg transition hover:shadow-xl relative`}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Thread Content */}
          <div className="flex-grow">
            {/* Thread header with user info */}
            <div className="mb-2">
              <UserThreadHeader 
                user={thread.user}
                createdAt={thread.createdAt}
                isPinned={thread.isPinned}
                showStatus={true}
                size="md"
                pinnedPosition="right"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-4 w-4 animate-spin" />
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
                    rows={4}
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
                <Link href={`/thread/${thread.id}`}>
                  <h3 className="hover:text-ufc-blue mb-2 text-lg font-bold text-white transition">
                    {title}
                    {isEdited && editedAt && (
                      <span className="ml-2 text-sm font-normal text-gray-400">
                        (edited {formatEditedDate(editedAt)})
                      </span>
                    )}
                  </h3>
                </Link>

                <p className="mb-4 line-clamp-2 text-gray-300">
                  {truncateText(content, 280)}
                </p>
              </>
            )}

            {/* Thread Poll Preview - only show in view mode */}
            {!isEditing && thread.poll && (
              <div className="mb-4 rounded-lg bg-gray-800 p-3">
                <p className="mb-2 font-medium text-white">
                  {thread.poll.question}
                </p>
                <div className="space-y-2">
                  {thread.poll.options.slice(0, 2).map((option) => {
                    const percentage = thread.poll?.votesCount
                      ? Math.round(
                          (option.votesCount / thread.poll.votesCount) * 100,
                        )
                      : 0;

                    return (
                      <div className="relative pt-1" key={option.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            {option.text}
                          </span>
                          <span className="text-sm text-gray-300">
                            {percentage}%
                          </span>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded bg-gray-700 text-xs">
                          <div
                            style={{ width: `${percentage}%` }}
                            className="flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none bg-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {thread.poll.options.length > 2 && (
                  <p className="mt-1 text-sm text-gray-400">
                    +{thread.poll.options.length - 2} more options
                  </p>
                )}

                <p className="mt-2 text-xs text-gray-400">
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
            {!isEditing && thread.media && thread.media.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-lg">
                <MediaPreview 
                  media={thread.media[0]} 
                  threadTitle={thread.title}
                />
                {thread.media.length > 1 && (
                  <div className="mt-2 text-sm text-gray-400 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    +{thread.media.length - 1} more {thread.media.length === 2 ? 'image' : 'images'}
                  </div>
                )}
              </div>
            )}

            {/* Thread Stats and Actions - only show in view mode */}
            {!isEditing && (
              <div className="flex items-center justify-between">
                {/* Thread reply count */}
                <div className="flex items-center text-sm text-gray-400">
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  {thread.repliesCount} replies
                </div>

                {/* Thread Actions */}
                <ThreadActions 
                  thread={thread}
                  onClickEdit={handleEdit}
                  size="sm"
                  className="ml-2"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
