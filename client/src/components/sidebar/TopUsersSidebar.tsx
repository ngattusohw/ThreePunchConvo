import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RankedUser } from "@/lib/types";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";

export default function TopUsersSidebar() {
  // Fetch top users
  const { data: topUsers, isLoading, error } = useQuery<RankedUser[]>({
    queryKey: ['/api/users/top'],
    // In a real app, we would fetch from the API
  });

  // For demo purposes, create mock users if none are returned from the API
  const displayUsers = topUsers?.length ? topUsers : generateMockTopUsers();

  return (
    <div className="bg-dark-gray rounded-lg overflow-hidden">
      <div className="bg-ufc-black p-4 border-b border-gray-800">
        <h2 className="font-heading text-lg font-bold text-white">Top Users</h2>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
            <p className="mt-2 text-gray-400 text-sm">Loading rankings...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-red-500">Error loading rankings</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayUsers.slice(0, 5).map((rankedUser) => (
              <li key={rankedUser.user.id} className="flex items-center py-2 hover:bg-gray-800 rounded-lg px-2 transition">
                <span className="text-gray-400 font-accent font-bold w-6">
                  #{rankedUser.position}{rankedUser.isTied ? "-T" : ""}
                </span>
                <UserAvatar user={rankedUser.user} size="sm" className="mr-3" />
                <div className="flex-grow">
                  <Link href={`/user/${rankedUser.user.username}`} className="text-white font-medium block leading-tight hover:text-ufc-red transition">
                    {rankedUser.user.username}
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
        
        <Link href="/rankings" className="block text-center text-ufc-red font-medium text-sm mt-4 hover:underline">
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

// Helper function to generate mock top users for demonstration
function generateMockTopUsers(): RankedUser[] {
  return [
    {
      position: 1,
      isTied: false,
      points: 8700,
      user: {
        id: 2,
        username: "KnockoutKing",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "CHAMPION",
        isOnline: true,
        postsCount: 342,
        likesCount: 4300,
        potdCount: 18,
        rank: 1,
        followersCount: 247,
        followingCount: 63,
        role: "USER",
      }
    },
    {
      position: 2,
      isTied: false,
      points: 6300,
      user: {
        id: 5,
        username: "StrikingQueen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "CONTENDER",
        isOnline: true,
        postsCount: 217,
        likesCount: 3800,
        potdCount: 12,
        rank: 2,
        followersCount: 148,
        followingCount: 76,
        role: "USER",
      }
    },
    {
      position: 3,
      isTied: false,
      points: 4500,
      user: {
        id: 4,
        username: "GrappleGuru",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 178,
        likesCount: 3100,
        potdCount: 9,
        rank: 3,
        followersCount: 103,
        followingCount: 89,
        role: "USER",
      }
    },
    {
      position: 4,
      isTied: false,
      points: 3700,
      user: {
        id: 6,
        username: "MMAHistorian",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 152,
        likesCount: 2700,
        potdCount: 6,
        rank: 4,
        followersCount: 87,
        followingCount: 113,
        role: "USER",
      }
    },
    {
      position: 5,
      isTied: false,
      points: 2900,
      user: {
        id: 7,
        username: "JiuJitsuJane",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 98,
        likesCount: 2200,
        potdCount: 4,
        rank: 5,
        followersCount: 62,
        followingCount: 74,
        role: "USER",
      }
    },
  ];
}
