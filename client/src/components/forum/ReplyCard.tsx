import { useLocalUser } from "@/api/hooks/useLocalUser";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { ThreadReply } from "@/lib/types";
import UserThreadHeader from "../ui/user-thread-header";
import { useState } from "react";
import { checkIsNormalUser } from "@/lib/utils";

interface ReplyCardProps {
  reply: ThreadReply & {
    level?: number;
    parentUsername?: string;
  };
  onQuote: (reply: ThreadReply) => void;
  likeReplyMutation: any; // Use any for now to avoid complex typing
  onDislike: () => void;
  onDelete: () => void;
  forceBlur?: boolean;
}

function ReplyCard({
  reply,
  onQuote,
  likeReplyMutation,
  onDelete,
  forceBlur = false,
}: ReplyCardProps) {
  const { user: currentUser } = useMemoizedUser();
  const { localUser } = useLocalUser();

  const [likeCount, setLikeCount] = useState(reply.likesCount);
  const [hasLiked, setHasLiked] = useState(reply.hasLiked);

  // Calculate indentation based on the reply's level in the thread
  const level = reply.level || 0;

  // Use fixed indentation classes based on level
  let indentationClass = "";
  if (level === 1) indentationClass = "ml-4 border-l-2 border-gray-700";
  else if (level === 2) indentationClass = "ml-8 border-l-2 border-gray-600";
  else if (level === 3) indentationClass = "ml-12 border-l-2 border-gray-600";
  else if (level >= 4) indentationClass = "ml-16 border-l-2 border-gray-600";

  const canDeleteReply =
    currentUser &&
    (currentUser.id === reply.user.externalId ||
      (currentUser.publicMetadata?.role as string) === "ADMIN" ||
      (currentUser.publicMetadata?.role as string) === "MODERATOR");

  // Check if user can like this reply
  const canLikeReply =
    currentUser && currentUser.id !== reply.user.externalId && !hasLiked;

  const isNormalUser = checkIsNormalUser(localUser?.role);
  // Check if content should be blurred (free user viewing fighter content)
  const shouldBlurContent =
    isNormalUser &&
    (forceBlur ||
      (localUser?.planType === "FREE" && reply.user.role === "FIGHTER"));

  const handleUpgrade = () => {
    window.location.href = "/checkout";
  };

  const handleLike = () => {
    if (!canLikeReply || likeReplyMutation.isPending(reply.id)) return;

    likeReplyMutation.mutate(reply.id.toString());
    setLikeCount(likeCount + 1);
    setHasLiked(true);
  };

  return (
    <div
      id={`reply-${reply.id}`}
      className={`bg-dark-gray overflow-hidden rounded-lg shadow-lg ${indentationClass} ${level > 0 ? "mt-2" : "mt-4"}`}
    >
      {level > 0 && reply.parentUsername && (
        <div className='flex items-center bg-gray-800 px-4 py-1 text-xs text-gray-400'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-1 h-3 w-3'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
            />
          </svg>
          Reply to{" "}
          <span className='text-ufc-blue ml-1 font-medium'>
            {reply.parentUsername}
          </span>
        </div>
      )}
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-grow'>
            <div className='mb-2'>
              <UserThreadHeader
                user={reply.user}
                createdAt={reply.createdAt}
                pinnedPosition='inline'
              />
            </div>

            {/* Content container with blur and overlay */}
            <div className={shouldBlurContent ? "relative" : ""}>
              <div
                className={`mb-4 whitespace-pre-line text-gray-300 ${shouldBlurContent ? "select-none blur-sm" : ""}`}
              >
                {shouldBlurContent ? "Premium Content" : reply.content}
              </div>

              {/* Reply Media */}
              {reply.media && reply.media.length > 0 && (
                <div
                  className={`mb-4 ${shouldBlurContent ? "select-none blur-sm" : ""}`}
                >
                  <img
                    src={reply.media[0].url}
                    alt={`Media for reply`}
                    className='max-h-72 w-auto rounded-lg'
                  />
                </div>
              )}

              {/* Premium Content Overlay */}
              {shouldBlurContent && (
                <button
                  onClick={handleUpgrade}
                  className='absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50'
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

            {/* Reply Actions */}
            <div className='flex items-center justify-between'>
              <button
                onClick={() => {
                  document
                    .getElementById("reply-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                  onQuote(reply);
                }}
                disabled={!currentUser}
                className='flex items-center text-gray-400 transition hover:text-white'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
                  />
                </svg>
                <span className='font-medium'>Reply</span>
              </button>
              {!shouldBlurContent && (
                <button
                  onClick={handleLike}
                  disabled={
                    !canLikeReply || likeReplyMutation.isPending(reply.id)
                  }
                  className={`flex items-center ${
                    hasLiked
                      ? "text-green-500"
                      : canLikeReply
                        ? "text-gray-400 hover:text-green-500"
                        : "text-gray-500"
                  } transition ${
                    likeReplyMutation.isPending(reply.id) ? "opacity-50" : ""
                  }`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-1 h-5 w-5'
                    fill={hasLiked ? "currentColor" : "none"}
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
                  <span className='font-medium'>{likeCount}</span>
                </button>
              )}
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
                className='flex items-center text-gray-400 transition hover:text-red-500'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
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

export default ReplyCard;
