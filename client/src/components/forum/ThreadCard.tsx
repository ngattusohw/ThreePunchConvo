import React from "react";
import { Link } from "wouter";
import { ForumThread } from "@/lib/types";
import { formatDate, truncateText } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import MediaPreview from "@/components/ui/media-preview";

interface ThreadCardProps {
  thread: ForumThread;
}

// Function to determine status color based on user status
const getStatusColorClass = (status: string): string => {
  switch (status) {
    case "HALL OF FAMER":
      return "text-amber-300"; // Gold for hall of famers
    case "CHAMPION":
      return "text-purple-400"; // Purple for champions
    case "CONTENDER":
      return "text-red-400"; // Red for contenders
    case "RANKED POSTER":
      return "text-orange-400"; // Orange for ranked posters
    case "COMPETITOR":
      return "text-green-400"; // Green for competitors
    case "REGIONAL POSTER":
      return "text-blue-400"; // Blue for regional posters
    case "AMATEUR":
      return "text-cyan-400"; // Cyan for amateurs
    default:
      return "text-gray-400"; // Gray as fallback
  }
};

export default function ThreadCard({ thread }: ThreadCardProps) {
  const borderColor = thread.isPinned
    ? "border-ufc-gold"
    : thread.isPinnedByUser
    ? "border-ufc-blue"
    : "";

  // Get user status rank for display below avatar
  const userRank = thread.user?.status || "";
  
  // Check if the user is not a fighter (role is not "FIGHTER")
  // Since the UserRole type doesn't include "FIGHTER", we need to check differently
  const isFighter = thread.user?.role === "FIGHTER";
    
  // Get the appropriate status color class
  const statusColorClass = userRank ? getStatusColorClass(userRank) : "text-gray-400";

  return (
    <div
      className={`bg-dark-gray ${borderColor ? `border-l-4 ${borderColor}` : ""} overflow-hidden rounded-lg shadow-lg transition hover:shadow-xl relative`}
    >
      {/* Pinned label on the right */}
      {(thread.isPinned || thread.isPinnedByUser) && (
        <span className="absolute top-2 right-2 bg-gray-800 text-ufc-blue text-xs px-2 py-0.5 rounded font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
          </svg>
          <span className="hidden md:inline">PINNED</span>
        </span>
      )}
      <div className="p-4">
        <div className="flex items-start">
          {/* User Avatar */}
          <div className="mr-3 flex-shrink-0 flex flex-col items-center">
            <UserAvatar user={thread.user} size="md" />
            {userRank && (
              <span className={`mt-1 text-xs ${statusColorClass} text-center`}>
                {userRank.length > 10 
                  ? userRank.substring(0, 8) + "..." 
                  : userRank}
              </span>
            )}
          </div>

          {/* Thread Content */}
          <div className="flex-grow">
            <div className="flex items-center mb-1 flex-wrap gap-2">
              {thread.user?.role === "FIGHTER" && (
                <span className="mr-2 flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-black">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723a3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  VERIFIED
                </span>
              )}

              {thread.user?.role === "ADMIN" && (
                <span className="bg-ufc-gold text-ufc-black mr-2 rounded px-2 py-0.5 text-xs font-bold">
                  ADMIN
                </span>
              )}

              {thread.user?.role === "MODERATOR" && (
                <span className="mr-2 rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  MOD
                </span>
              )}

              <span className="font-medium text-white">
                <span className="md:hidden">
                  {thread.user?.username && thread.user.username.length > 15 
                    ? thread.user.username.substring(0, 13) + "..." 
                    : thread.user?.username || "Unknown User"}
                </span>
                <span className="hidden md:inline">
                  {thread.user?.username || "Unknown User"}
                </span>
              </span>
              
              {thread.user?.rank !== undefined && !isFighter && (
                  <div className="bg-gradient-to-br from-orange-500 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-xl inline-flex items-center gap-1 shadow-lg shadow-orange-500/30">
                        {/* <div className="w-3 h-3 bg-white rounded-full inline-block">
                        </div> */}
                        {/* <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvklEQVR4nM3SwUqCURCG4aeNuM47cO+ie4hwJYhJV5CEkQVKChFJ66DLcO1VuPQeBMFFi/YJijCLw+H/FdrUBwPDzLxzDuc7/CfVMcQLVljjDY/oFAFnuME7vrA7Epc53DoBpDHJ4deCoWVJfpfD02h8JkPTkryLShFcBqT5PS5+A2/j5a9TeBTNZ3xH9KO2CZt2WGCOpxQ+xwNquEIT1agdFn7E6WP8lPmd62BL7sIs/sVJNdBDG7cYxI3+WHsTQ1Q7qzdMlAAAAABJRU5ErkJggg==" alt="forward-punch"></img> */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path d="M18.5 5a5.497 5.497 0 0 1-5.5 5.5 5.49 5.49 0 0 1 5.5 5.5 5.497 5.497 0 0 1 5.5-5.5A5.497 5.497 0 0 1 18.5 5zM6.5 12A5.497 5.497 0 0 1 12 6.5 5.497 5.497 0 0 1 6.5 1 5.497 5.497 0 0 1 1 6.5a5.489 5.489 0 0 1 3.1.95A5.5 5.5 0 0 1 6.5 12zM10.5 13A5.497 5.497 0 0 1 5 18.5a5.49 5.49 0 0 1 5.5 5.5 5.497 5.497 0 0 1 5.5-5.5 5.497 5.497 0 0 1-5.5-5.5z" className="fill:#232326"/></svg>
                        FC: {thread.user.rank}
                  </div>
              )}
              
              <span className="text-sm text-gray-400">
            · {formatDate(thread.createdAt)}
              </span>
            </div>

            <Link href={`/thread/${thread.id}`}>
              <h3 className="hover:text-ufc-blue mb-2 text-lg font-bold text-white transition">
                {thread.title}
              </h3>
            </Link>

            <p className="mb-4 line-clamp-2 text-gray-300">
              {truncateText(thread.content, 280)}
            </p>

            {/* Thread Poll Preview */}
            {thread.poll && (
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

            {/* Thread Media Preview */}
            {thread.media && thread.media.length > 0 && (
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

            {/* Thread Stats */}
            <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
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

              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5 text-green-500"
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
                {thread.likesCount}
              </div>

              {/* {thread.dislikesCount > 0 && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                  {thread.dislikesCount}
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
