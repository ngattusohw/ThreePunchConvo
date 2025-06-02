import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RankedUser } from "@/lib/types";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";

export default function TopUsersSidebar() {
  // Fetch top users
  const { data: topUsers, isLoading, error } = useQuery<RankedUser[]>({
    queryKey: ['/api/users/top'],
  });

  const displayUsers = topUsers;

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return topUsers?.length && (
    <div className="bg-dark-gray rounded-lg p-4">
      <h2 className="font-heading text-lg font-bold mb-4 text-white">Top Users</h2>
      
      <div>
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ufc-blue mx-auto"></div>
            <p className="mt-2 text-gray-400 text-sm">Loading rankings...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-red-500">Error loading rankings</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayUsers?.slice(0, 5).map((rankedUser) => (
              <li key={rankedUser.user.id} className="flex items-center py-2 hover:bg-gray-800 rounded-lg px-2 transition">
                <span className="text-gray-400 font-accent font-bold w-10 whitespace-nowrap">
                  #{rankedUser.position}{rankedUser.isTied ? "-T" : ""}
                </span>
                <UserAvatar user={rankedUser.user} size="sm" className="mr-3" />
                <div className="flex-grow overflow-hidden">
                  <Link href={`/user/${rankedUser.user.username}`} className="text-white font-medium block leading-tight hover:text-ufc-blue transition truncate">
                    {truncateText(rankedUser.user.username, 15)}
                  </Link>
                  <StatusBadge status={rankedUser.user.status} />
                </div>
                <div className="text-gray-400 text-sm">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {formatLikesCount(rankedUser.user.likesCount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <Link href="/rankings" className="block text-center text-ufc-blue font-medium text-sm mt-4 hover:underline">
          View Full Rankings →
        </Link>
      </div>
    </div>
  );
}

// Helper function to format the likes count (e.g., 4300 -> 4.3k)
function formatLikesCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}