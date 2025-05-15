import { Link } from "wouter";
import { ForumThread } from "@/lib/types";
import { formatDate, truncateText } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";

interface ThreadCardProps {
  thread: ForumThread;
}

export default function ThreadCard({ thread }: ThreadCardProps) {
  const borderColor = thread.isPinned
    ? "border-ufc-gold"
    : thread.isPotd
    ? "border-ufc-red"
    : "";

  return (
    <div className={`bg-dark-gray ${borderColor ? `border-l-4 ${borderColor}` : ""} rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition`}>
      <div className="p-4">
        <div className="flex items-start">
          {/* User Avatar */}
          <div className="mr-3 flex-shrink-0">
            <UserAvatar user={thread.user} size="md" />
          </div>
          
          {/* Thread Content */}
          <div className="flex-grow">
            <div className="flex items-center mb-1 flex-wrap">
              {thread.isPinned && (
                <span className="bg-gray-800 text-ufc-gold text-xs px-2 py-0.5 rounded font-medium mr-2">
                  PINNED
                </span>
              )}
              
              {thread.isPotd && (
                <span className="bg-ufc-red text-white text-xs px-2 py-0.5 rounded font-bold mr-2">
                  POTD
                </span>
              )}
              
              {thread.user?.status && <StatusBadge status={thread.user.status} className="mr-2" />}
              
              {thread.user?.role === "PRO" && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold mr-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  VERIFIED
                </span>
              )}
              
              {thread.user?.role === "ADMIN" && (
                <span className="bg-ufc-gold text-ufc-black text-xs px-2 py-0.5 rounded font-bold mr-2">
                  ADMIN
                </span>
              )}
              
              {thread.user?.role === "MODERATOR" && (
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold mr-2">
                  MOD
                </span>
              )}
              
              <span className="text-white font-medium">{thread.user?.username || "Unknown User"}</span>
              <span className="text-gray-400 text-sm ml-2">· {formatDate(thread.createdAt)}</span>
            </div>
            
            <Link href={`/thread/${thread.id}`}>
              <h3 className="text-white font-bold text-lg mb-2 hover:text-ufc-red transition">
                {thread.title}
              </h3>
            </Link>
            
            <p className="text-gray-300 mb-4 line-clamp-2">
              {truncateText(thread.content, 280)}
            </p>
            
            {/* Thread Poll Preview */}
            {thread.poll && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-white font-medium mb-2">{thread.poll.question}</p>
                <div className="space-y-2">
                  {thread.poll.options.slice(0, 2).map((option) => {
                    const percentage = thread.poll?.votesCount 
                      ? Math.round((option.votesCount / thread.poll.votesCount) * 100) 
                      : 0;
                    
                    return (
                      <div className="relative pt-1" key={option.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300">{option.text}</span>
                          <span className="text-sm text-gray-300">{percentage}%</span>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
                          <div 
                            style={{ width: `${percentage}%` }} 
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${option.id % 2 === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {thread.poll.options.length > 2 && (
                  <p className="text-gray-400 text-sm mt-1">+{thread.poll.options.length - 2} more options</p>
                )}
                
                <p className="text-gray-400 text-xs mt-2">
                  {thread.poll.votesCount} votes • 
                  {new Date() > thread.poll.expiresAt 
                    ? ' Ended' 
                    : ` ${Math.ceil((thread.poll.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`}
                </p>
              </div>
            )}
            
            {/* Thread Media Preview */}
            {thread.media && thread.media.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={thread.media[0].url} 
                  alt={`Media for ${thread.title}`} 
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            
            {/* Thread Stats */}
            <div className="flex flex-wrap items-center text-sm text-gray-400 space-x-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {thread.repliesCount} replies
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {thread.likesCount}
              </div>
              
              {thread.dislikesCount > 0 && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                  {thread.dislikesCount}
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
