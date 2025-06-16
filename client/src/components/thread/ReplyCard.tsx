import react from "react";
import { ThreadReply } from "@/lib/types";
import UserThreadHeader from "@/components/ui/user-thread-header";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";

interface ReplyCardProps {
  reply: ThreadReply & {
    level?: number;
    parentUsername?: string;
  };
  onQuote: (reply: ThreadReply) => void;
  onLike: () => void;
  onDislike: () => void;
  onDelete: () => void;
}

export default function ReplyCard({
  reply,
  onQuote,
  onLike,
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
      (currentUser.originalUser?.publicMetadata?.role as string) === "ADMIN" ||
      (currentUser.originalUser?.publicMetadata?.role as string) === "MODERATOR");

  return (
    <div
      id={`reply-${reply.id}`}
      className={`bg-dark-gray overflow-hidden rounded-lg shadow-lg ${indentationClass} ${level > 0 ? "mt-2" : "mt-4"} transition-all duration-300`}
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
                onClick={onLike}
                disabled={!currentUser}
                className="flex items-center text-gray-400 transition hover:text-green-500"
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
