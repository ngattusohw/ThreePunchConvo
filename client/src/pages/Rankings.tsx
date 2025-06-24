import { useState } from "react";
import { Link } from "wouter";
import { RankedUser } from "@/lib/types";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import { shortenNumber } from "@/lib/utils";
import { useTopUsers } from "@/api";
import UserRoleBadge from "@/components/ui/UserBadge";

export default function Rankings() {
  const [rankingFilter, setRankingFilter] = useState<string>("all");

  // Fetch rankings
  const { topUsers: rankedUsers, isLoading, error } = useTopUsers();

  // Process users to handle ties
  const processedUsers =
    rankedUsers?.reduce((acc, user, index, array) => {
      // Find all users with the same points (including current user)
      const tiedUsers = array.filter((u) => u.points === user.points);
      const isTied = tiedUsers.length > 1;

      // Calculate position based on how many users with higher points exist
      const usersWithHigherPoints = array.filter((u) => u.points > user.points);
      const position = usersWithHigherPoints.length + 1;

      acc.push({
        ...user,
        position,
        isTied,
      });

      return acc;
    }, [] as RankedUser[]) ?? [];

  // Filter users by status if needed
  const filteredUsers =
    rankingFilter === "all"
      ? processedUsers
      : processedUsers.filter((user) =>
          user.user.status.toLowerCase().includes(rankingFilter.toLowerCase()),
        );

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='mb-6'>
        <h1 className='font-heading mb-2 text-2xl font-bold text-white'>
          Community Rankings
        </h1>
        <p className='text-gray-400'>
          See who's leading the pack in our community rankings
        </p>
      </div>

      {/* Filter Options */}
      <div className='mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
        <button
          onClick={() => setRankingFilter("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            rankingFilter === "all"
              ? "bg-ufc-blue text-black"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          All Ranks
        </button>
        <button
          onClick={() => setRankingFilter("hall")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            rankingFilter === "hall"
              ? "status-hof"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Hall of Famers
        </button>
        <button
          onClick={() => setRankingFilter("champion")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            rankingFilter === "champion"
              ? "status-champion"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Champions
        </button>
        <button
          onClick={() => setRankingFilter("contender")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            rankingFilter === "contender"
              ? "status-contender"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Contenders
        </button>
        <button
          onClick={() => setRankingFilter("ranked")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            rankingFilter === "ranked"
              ? "status-ranked text-white"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Ranked Posters
        </button>
      </div>

      {/* Ranking Explanation */}
      <div className='bg-dark-gray mb-6 rounded-lg p-4'>
        <h2 className='mb-2 font-bold text-white'>About Rankings</h2>
        <p className='text-sm text-gray-300'>
          Rankings are calculated based on your community contributions. Earn
          points through posting quality content, receiving likes, having your
          posts selected as Post of the Day, and more. Status levels from
          highest to lowest: Hall of Famer, Champion, Contender, Ranked Poster,
          Competitor, Regional Poster, and Amateur.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='py-20 text-center'>
          <div className='border-ufc-blue mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
          <p className='mt-4 text-gray-400'>Loading rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='my-8 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
          <p className='text-red-500'>
            Error loading rankings. Please try again later.
          </p>
        </div>
      )}

      {/* Rankings Table */}
      {!isLoading && !error && (
        <div className='bg-dark-gray overflow-hidden rounded-lg'>
          <div className='bg-ufc-black hidden p-4 text-sm font-medium text-gray-400 md:flex'>
            <div className='w-16 text-center'>Rank</div>
            <div className='flex-1'>User</div>
            <div className='w-24 text-center'>Status</div>
            <div className='w-20 text-center'>Posts</div>
            <div className='w-20 text-center'>Likes</div>
            <div className='w-20 text-center'>POTD</div>
            <div className='w-20 text-center'>Replies</div>
            <div className='w-20 text-center'>Pinned</div>
            <div className='w-24 text-center'>Score</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className='p-12 text-center'>
              <p className='text-gray-400'>No users found in this category.</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-800'>
              {filteredUsers.map((rankedUser) => (
                <div
                  key={rankedUser.user.id}
                  className='p-4 transition hover:bg-gray-800'
                >
                  {/* Desktop layout */}
                  <div className='hidden items-center lg:flex lg:flex-nowrap'>
                    {/* Rank */}
                    <div className='w-16 text-center'>
                      <span className='font-accent text-ufc-gold text-lg font-bold'>
                        #{rankedUser.position}
                        {rankedUser.isTied ? "-T" : ""}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className='flex flex-1 items-center'>
                      <UserAvatar
                        user={rankedUser.user}
                        size='md'
                        className='mr-3'
                      />
                      <div>
                        <Link
                          href={`/user/${rankedUser.user.username}`}
                          className='hover:text-ufc-blue font-medium text-white transition'
                          title={rankedUser.user.username}
                        >
                          {rankedUser.user.username.length > 25 
                            ? `${rankedUser.user.username.slice(0, 25)}...` 
                            : rankedUser.user.username}
                        </Link>

                        <UserRoleBadge role={rankedUser.user.role} />
                      </div>
                    </div>

                    {/* Status */}
                    <div className='w-24 text-center'>
                      <StatusBadge status={rankedUser.user.status} />
                    </div>

                    {/* Stats */}
                    <div className='w-20 text-center'>
                      <span className='text-white'>
                        {shortenNumber(rankedUser.user.postsCount)}
                      </span>
                    </div>
                    <div className='w-20 text-center'>
                      <span className='text-white'>
                        {shortenNumber(rankedUser.user.likesCount)}
                      </span>
                    </div>
                    <div className='w-20 text-center'>
                      <span className='text-white'>
                        {rankedUser.user.potdCount}
                      </span>
                    </div>
                    <div className='w-20 text-center'>
                      <span className='text-white'>
                        {rankedUser.user.repliesCount}
                      </span>
                    </div>
                    <div className='w-20 text-center'>
                      <span className='text-white'>
                        {rankedUser.user.pinnedByUserCount}
                      </span>
                    </div>
                    <div className='w-24 text-center'>
                      <span className='text-ufc-blue font-bold'>
                        {shortenNumber(rankedUser.points)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className='lg:hidden'>
                    <div className='mb-2 flex items-center justify-between'>
                      {/* Rank */}
                      <span className='font-accent text-ufc-gold text-xl font-bold'>
                        #{rankedUser.position}
                        {rankedUser.isTied ? "-T" : ""}
                      </span>

                      {/* Points */}
                      <span className='text-ufc-blue text-lg font-bold'>
                        {shortenNumber(rankedUser.points)} pts
                      </span>
                    </div>

                    <div className='flex items-center'>
                      <UserAvatar
                        user={rankedUser.user}
                        size='md'
                        className='mr-3 flex-shrink-0'
                      />
                      <div className='min-w-0 flex-1'>
                        <Link
                          href={`/user/${rankedUser.user.username}`}
                          className='hover:text-ufc-blue block truncate font-medium text-white transition'
                        >
                          {rankedUser.user.username.length > 20 
                            ? `${rankedUser.user.username.slice(0, 20)}...` 
                            : rankedUser.user.username}
                        </Link>

                        <div className='mt-1 flex items-center space-x-2'>
                          <StatusBadge status={rankedUser.user.status} />

                          {rankedUser.user.role === "FIGHTER" && (
                            <span className='flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='mr-1 h-3 w-3'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              PRO FIGHTER
                            </span>
                          )}
                          {rankedUser?.user?.role ===
                            "INDUSTRY_PROFESSIONAL" && (
                            <span className='flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='mr-1 h-3 w-3'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              MMA INDUSTRY
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='mt-3 flex flex-wrap gap-2 rounded-lg bg-gray-800 p-2 text-center text-sm'>
                      <div className='flex-1 min-w-[100px] p-1'>
                        <div className='font-medium text-white'>
                          {shortenNumber(rankedUser.user.postsCount)}
                        </div>
                        <div className='text-xs text-gray-400'>Posts</div>
                      </div>
                      <div className='flex-1 min-w-[100px] p-1'>
                        <div className='font-medium text-white'>
                          {shortenNumber(rankedUser.user.likesCount)}
                        </div>
                        <div className='text-xs text-gray-400'>Likes</div>
                      </div>
                      <div className='flex-1 min-w-[100px] p-1'>
                        <div className='font-medium text-white'>
                          {shortenNumber(rankedUser.user.potdCount)}
                        </div>
                        <div className='text-xs text-gray-400'>POTD</div>
                      </div>
                      <div className='flex-1 min-w-[100px] p-1'>
                        <div className='font-medium text-white'>
                          {shortenNumber(rankedUser.user.repliesCount)}
                        </div>
                        <div className='text-xs text-gray-400'>Replies</div>
                      </div>
                      <div className='flex-1 min-w-[100px] p-1'>
                        <div className='font-medium text-white'>
                          {rankedUser.user.pinnedByUserCount}
                        </div>
                        <div className='text-xs text-gray-400'>Pinned</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
