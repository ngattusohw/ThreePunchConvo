import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RankedUser } from "@/lib/types";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import { shortenNumber } from "@/lib/utils";

export default function Rankings() {
  const [rankingFilter, setRankingFilter] = useState<string>("all");

  // Fetch rankings
  const {
    data: rankedUsers,
    isLoading,
    error,
  } = useQuery<RankedUser[]>({
    queryKey: ["/api/users/top"],
  });

  // Process users to handle ties
  const processedUsers = rankedUsers?.reduce((acc, user, index, array) => {
    // Find all users with the same points (including current user)
    const tiedUsers = array.filter(u => u.points === user.points);
    const isTied = tiedUsers.length > 1;
    
    // Calculate position based on how many users with higher points exist
    const usersWithHigherPoints = array.filter(u => u.points > user.points);
    const position = usersWithHigherPoints.length + 1;
    
    acc.push({
      ...user,
      position,
      isTied
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
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white mb-2">
          Community Rankings
        </h1>
        <p className="text-gray-400">
          See who's leading the pack in our community rankings
        </p>
      </div>

      {/* Filter Options */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setRankingFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            rankingFilter === "all"
              ? "bg-ufc-red text-white"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          All Ranks
        </button>
        <button
          onClick={() => setRankingFilter("hall")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            rankingFilter === "hall"
              ? "status-hof"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Hall of Famers
        </button>
        <button
          onClick={() => setRankingFilter("champion")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            rankingFilter === "champion"
              ? "status-champion"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Champions
        </button>
        <button
          onClick={() => setRankingFilter("contender")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            rankingFilter === "contender"
              ? "status-contender"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Contenders
        </button>
        <button
          onClick={() => setRankingFilter("ranked")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            rankingFilter === "ranked"
              ? "status-ranked text-white"
              : "bg-dark-gray text-gray-300 hover:bg-gray-800"
          }`}
        >
          Ranked Posters
        </button>
      </div>

      {/* Ranking Explanation */}
      <div className="bg-dark-gray p-4 rounded-lg mb-6">
        <h2 className="font-bold text-white mb-2">About Rankings</h2>
        <p className="text-gray-300 text-sm">
          Rankings are calculated based on your community contributions. Earn
          points through posting quality content, receiving likes, having your
          posts selected as Post of the Day, and more. Status levels from
          highest to lowest: Hall of Famer, Champion, Contender, Ranked Poster,
          Competitor, Regional Poster, and Amateur.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center my-8">
          <p className="text-red-500">
            Error loading rankings. Please try again later.
          </p>
        </div>
      )}

      {/* Rankings Table */}
      {!isLoading && !error && (
        <div className="bg-dark-gray rounded-lg overflow-hidden">
          <div className="bg-ufc-black p-4 hidden md:flex text-gray-400 font-medium text-sm">
            <div className="w-16 text-center">Rank</div>
            <div className="flex-1">User</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-20 text-center">Posts</div>
            <div className="w-20 text-center">Likes</div>
            <div className="w-20 text-center">POTD</div>
            <div className="w-24 text-center">Score</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No users found in this category.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredUsers.map((rankedUser) => (
                <div
                  key={rankedUser.user.id}
                  className="p-4 hover:bg-gray-800 transition flex flex-wrap md:flex-nowrap items-center"
                >
                  {/* Rank */}
                  <div className="w-full md:w-16 mb-2 md:mb-0 text-center">
                    <span className="text-lg font-accent font-bold text-ufc-gold">
                      #{rankedUser.position}
                      {rankedUser.isTied ? "-T" : ""}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center flex-1">
                    <UserAvatar
                      user={rankedUser.user}
                      size="md"
                      className="mr-3"
                    />
                    <div>
                      <Link
                        href={`/user/${rankedUser.user.username}`}
                        className="text-white font-medium hover:text-ufc-red transition"
                      >
                        {rankedUser.user.username}
                      </Link>

                      {rankedUser.user.role === "PRO" && (
                        <div className="flex items-center mt-1">
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            VERIFIED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-full md:w-24 my-2 md:my-0 md:text-center">
                    <StatusBadge status={rankedUser.user.status} />
                  </div>

                  {/* Stats - Mobile View */}
                  <div className="w-full flex md:hidden justify-between text-sm text-gray-400 mt-2">
                    <div>
                      <span className="font-bold text-gray-300">
                        {rankedUser.user.postsCount}
                      </span>{" "}
                      posts
                    </div>
                    <div>
                      <span className="font-bold text-gray-300">
                        {rankedUser.user.likesCount}
                      </span>{" "}
                      likes
                    </div>
                    <div>
                      <span className="font-bold text-gray-300">
                        {rankedUser.user.potdCount}
                      </span>{" "}
                      POTD
                    </div>
                    <div>
                      <span className="font-bold text-gray-300">
                        {rankedUser.points}
                      </span>{" "}
                      pts
                    </div>
                  </div>

                  {/* Stats - Desktop View */}
                  <div className="hidden md:block w-20 text-center">
                    <span className="text-white">
                      {shortenNumber(rankedUser.user.postsCount)}
                    </span>
                  </div>
                  <div className="hidden md:block w-20 text-center">
                    <span className="text-white">
                      {shortenNumber(rankedUser.user.likesCount)}
                    </span>
                  </div>
                  <div className="hidden md:block w-20 text-center">
                    <span className="text-white">
                      {rankedUser.user.potdCount}
                    </span>
                  </div>
                  <div className="hidden md:block w-24 text-center">
                    <span className="text-ufc-red font-bold">
                      {shortenNumber(rankedUser.points)}
                    </span>
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
