import React from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import { useTopUsers } from "@/api/hooks/useTopUsers";

export default function TopUsersSidebar() {
  // Fetch top users
  const { topUsers, isLoading, error } = useTopUsers();

  const displayUsers = topUsers;

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    topUsers?.length && (
      <div className='bg-dark-gray rounded-lg p-4'>
        <h2 className='font-heading mb-4 text-lg font-bold text-white'>
          Top Users
        </h2>

        <div>
          {isLoading ? (
            <div className='py-4 text-center'>
              <div className='border-ufc-blue mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2'></div>
              <p className='mt-2 text-sm text-gray-400'>Loading rankings...</p>
            </div>
          ) : error ? (
            <div className='py-4 text-center'>
              <p className='text-red-500'>Error loading rankings</p>
            </div>
          ) : (
            <ul className='space-y-3'>
              {displayUsers?.slice(0, 5).map((rankedUser) => (
                <li
                  key={rankedUser.user.id}
                  className='flex items-center rounded-lg px-2 py-2 transition hover:bg-gray-800'
                >
                  <span className='font-accent w-10 whitespace-nowrap font-bold text-gray-400'>
                    #{rankedUser.position}
                    {rankedUser.isTied ? "-T" : ""}
                  </span>
                  <UserAvatar
                    user={rankedUser.user}
                    size='sm'
                    className='mr-3'
                  />
                  <div className='flex-grow overflow-hidden'>
                    <Link
                      href={`/user/${rankedUser.user.username}`}
                      className='hover:text-ufc-blue block truncate font-medium leading-tight text-white transition'
                    >
                      {truncateText(rankedUser.user.username, 15)}
                    </Link>
                    <StatusBadge status={rankedUser.user.status} />
                  </div>
                  <div className='text-sm text-gray-400'>
                    <span className='flex items-center'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='mr-1 h-4 w-4 text-green-500'
                        fill='none'
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
                      {formatLikesCount(rankedUser.user.likesCount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            href='/rankings'
            className='text-ufc-blue mt-4 block text-center text-sm font-medium hover:underline'
          >
            View Full Rankings →
          </Link>
        </div>
      </div>
    )
  );
}

// Helper function to format the likes count (e.g., 4300 -> 4.3k)
function formatLikesCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count.toString();
}
