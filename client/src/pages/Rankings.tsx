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
    // In a real app, we would fetch from the API
  });

  // For demo purposes, create mock users if none are returned from the API
  const allRankedUsers =
    rankedUsers?.length && !error ? rankedUsers : generateMockRankedUsers();

  // Filter users by status if needed
  const filteredUsers =
    rankingFilter === "all"
      ? allRankedUsers
      : allRankedUsers.filter((user) =>
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
      {/* {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center my-8">
          <p className="text-red-500">
            Error loading rankings. Please try again later.
          </p>
          <p>Error {error.message}</p>
        </div>
      )} */}

      {/* Rankings Table */}
      {/* !error */}
      {!isLoading && (
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

// Helper function to generate mock ranked users for demonstration
function generateMockRankedUsers(): RankedUser[] {
  const users = [
    {
      position: 1,
      isTied: false,
      points: 11500,
      user: {
        id: 1,
        username: "OctagonInsider",
        avatar:
          "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "HALL OF FAMER",
        isOnline: true,
        postsCount: 427,
        likesCount: 8341,
        potdCount: 37,
        rank: 1,
        followersCount: 689,
        followingCount: 203,
        role: "ADMIN",
      },
    },
    {
      position: 2,
      isTied: false,
      points: 8700,
      user: {
        id: 2,
        username: "KnockoutKing",
        avatar:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "CHAMPION",
        isOnline: true,
        postsCount: 342,
        likesCount: 4300,
        potdCount: 18,
        rank: 2,
        followersCount: 247,
        followingCount: 63,
        role: "USER",
      },
    },
    {
      position: 3,
      isTied: false,
      points: 6300,
      user: {
        id: 5,
        username: "StrikingQueen",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "CONTENDER",
        isOnline: true,
        postsCount: 217,
        likesCount: 3800,
        potdCount: 12,
        rank: 3,
        followersCount: 148,
        followingCount: 76,
        role: "USER",
      },
    },
    {
      position: 4,
      isTied: false,
      points: 4500,
      user: {
        id: 4,
        username: "GrappleGuru",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 178,
        likesCount: 3100,
        potdCount: 9,
        rank: 4,
        followersCount: 103,
        followingCount: 89,
        role: "USER",
      },
    },
    {
      position: 5,
      isTied: false,
      points: 3700,
      user: {
        id: 6,
        username: "MMAHistorian",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 152,
        likesCount: 2700,
        potdCount: 6,
        rank: 5,
        followersCount: 87,
        followingCount: 113,
        role: "USER",
      },
    },
    {
      position: 6,
      isTied: false,
      points: 2900,
      user: {
        id: 7,
        username: "JiuJitsuJane",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 98,
        likesCount: 2200,
        potdCount: 4,
        rank: 6,
        followersCount: 62,
        followingCount: 74,
        role: "USER",
      },
    },
    {
      position: 7,
      isTied: false,
      points: 2700,
      user: {
        id: 8,
        username: "FightDoctor",
        avatar:
          "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: false,
        postsCount: 132,
        likesCount: 1850,
        potdCount: 2,
        rank: 7,
        followersCount: 52,
        followingCount: 37,
        role: "USER",
      },
    },
    {
      position: 8,
      isTied: false,
      points: 2300,
      user: {
        id: 9,
        username: "CoachCorner",
        avatar:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 89,
        likesCount: 1560,
        potdCount: 3,
        rank: 8,
        followersCount: 41,
        followingCount: 28,
        role: "USER",
      },
    },
    {
      position: 9,
      isTied: true,
      points: 2100,
      user: {
        id: 10,
        username: "SubmissionSpecialist",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: false,
        postsCount: 76,
        likesCount: 1340,
        potdCount: 1,
        rank: 9,
        followersCount: 36,
        followingCount: 42,
        role: "USER",
      },
    },
    {
      position: 9,
      isTied: true,
      points: 2100,
      user: {
        id: 11,
        username: "StrikeForce",
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 95,
        likesCount: 1100,
        potdCount: 5,
        rank: 9,
        followersCount: 29,
        followingCount: 52,
        role: "USER",
      },
    },
    {
      position: 11,
      isTied: false,
      points: 1800,
      user: {
        id: 12,
        username: "RingIQ",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 64,
        likesCount: 950,
        potdCount: 3,
        rank: 11,
        followersCount: 27,
        followingCount: 48,
        role: "USER",
      },
    },
    {
      position: 12,
      isTied: false,
      points: 1600,
      user: {
        id: 13,
        username: "FighterFan84",
        avatar:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 57,
        likesCount: 870,
        potdCount: 2,
        rank: 12,
        followersCount: 42,
        followingCount: 63,
        role: "USER",
      },
    },
    {
      position: 13,
      isTied: false,
      points: 1400,
      user: {
        id: 14,
        username: "KickboxingKid",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: false,
        postsCount: 48,
        likesCount: 720,
        potdCount: 1,
        rank: 13,
        followersCount: 19,
        followingCount: 54,
        role: "USER",
      },
    },
    {
      position: 14,
      isTied: false,
      points: 1200,
      user: {
        id: 15,
        username: "CageCritic",
        avatar:
          "https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "COMPETITOR",
        isOnline: true,
        postsCount: 36,
        likesCount: 650,
        potdCount: 0,
        rank: 14,
        followersCount: 15,
        followingCount: 28,
        role: "USER",
      },
    },
    {
      position: 15,
      isTied: false,
      points: 900,
      user: {
        id: 16,
        username: "OctagonEdge",
        avatar:
          "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "REGIONAL POSTER",
        isOnline: false,
        postsCount: 29,
        likesCount: 340,
        potdCount: 0,
        rank: 15,
        followersCount: 11,
        followingCount: 42,
        role: "USER",
      },
    },
  ];

  return users;
}
