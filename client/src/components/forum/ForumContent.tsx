import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import ThreadCard from "@/components/forum/ThreadCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ForumThread, ForumCategory, UserStatus } from "@/lib/types";
import { FORUM_CATEGORIES } from "@/lib/constants";
import CreatePostModal from "@/components/forum/CreatePostModal";
import { formatDistanceToNow } from "date-fns";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { apiRequest } from "@/lib/queryClient";

interface ForumContentProps {
  category?: string;
}

export default function ForumContent({
  category = "general",
}: ForumContentProps) {
  const queryClient = useQueryClient();
  const [filterOption, setFilterOption] = useState<
    "recent" | "popular" | "new"
  >("recent");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">(
    "all",
  );
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [allRegularThreads, setAllRegularThreads] = useState<ForumThread[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  // Get the current category info
  const currentCategory =
    FORUM_CATEGORIES.find((cat) => cat.id === category) || FORUM_CATEGORIES[0];

  // Query for POTD threads
  const { data: potdThreads = [], isLoading: isPotdLoading } = useQuery<
    ForumThread[]
  >({
    queryKey: [`/api/threads/${category}`, "potd"],
    queryFn: async () => {
      const params = new URLSearchParams({
        potdFilter: "only",
        sort: "recent",
      });
      const response = await apiRequest(
        "GET",
        `/api/threads/${category}?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch POTD threads");
      }
      return response.json();
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Query for regular threads (non-POTD)
  const {
    data: regularThreads = [],
    isLoading: isRegularLoading,
    error,
    refetch: refetchRegularThreads,
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, filterOption, timeRange, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        potdFilter: "exclude",
        sort: filterOption,
        timeRange: timeRange,
        limit: String(limit),
        offset: String(page * limit),
      });
      const response = await apiRequest(
        "GET",
        `/api/threads/${category}?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch regular threads");
      }
      return response.json();
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data always stale to force refetch
  });

  // Update allRegularThreads when regularThreads changes
  useEffect(() => {
    if (!regularThreads || isRegularLoading) return;
    if (regularThreads) {
      if (page === 0) {
        // Replace all threads when filters change (page is reset to 0)
        setAllRegularThreads(regularThreads);
      } else {
        // Append new threads when loading more
        setAllRegularThreads((prev) => [...prev, ...regularThreads]);
      }

      // Check if we have more threads to load
      setHasMore(regularThreads.length >= limit);
    }
  }, [regularThreads, page, limit, category]);

  // Reset pagination and force refetch when filter options change
  // useEffect(() => {
  //   const resetAndRefetch = async () => {
  //     setPage(0);
  //     console.log("help me, im here resetting")
  //     setAllRegularThreads([]);
  //     setHasMore(true); // Reset the hasMore flag to enable loading
  //     await refetchRegularThreads(); // Force a refetch when filter changes
  //   };

  //   resetAndRefetch();
  // }, [filterOption, timeRange, category, refetchRegularThreads]);

  // Scroll to the loading area when new content is loaded
  useEffect(() => {
    if (page > 0 && regularThreads.length > 0 && loadMoreRef.current) {
      const previousHeight =
        loadMoreRef.current.offsetTop - window.innerHeight / 2;
      window.scrollTo({
        top: previousHeight,
        behavior: "auto",
      });
    }
  }, [regularThreads, page]);

  const isLoading = isPotdLoading || isRegularLoading;

  const loadMore = () => {
    if (hasMore && !isRegularLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // Helper function to handle filter changes
  const handleFilterChange = (newFilter: "recent" | "popular" | "new") => {
    if (newFilter === filterOption) {
      // If clicking the same filter, force a refresh
      setAllRegularThreads([]);
      setPage(0);
      setHasMore(true);
      setTimeout(() => {
        refetchRegularThreads();
      }, 0);
    } else {
      setFilterOption(newFilter);
    }
  };

  // Helper function to handle time range changes
  const handleTimeRangeChange = (
    newTimeRange: "all" | "week" | "month" | "year",
  ) => {
    if (newTimeRange === timeRange) {
      // If selecting the same time range, force a refresh
      setAllRegularThreads([]);
      setPage(0);
      setHasMore(true);
      setTimeout(() => {
        refetchRegularThreads();
      }, 0);
    } else {
      setTimeRange(newTimeRange as any);
    }
  };

  return (
    <div className="flex-grow">
      {/* Forum Header and Actions */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="md:max-w-[70%]">
          <h1 className="font-heading mb-1 text-2xl font-bold text-white">
            {currentCategory.name}
          </h1>
          <p className="text-sm text-gray-400">{currentCategory.description}</p>
        </div>

        <div className="mt-4 flex space-x-3 md:mt-0">
          {/* Hiding search */}
          {/* <div className="relative">
            <input 
              type="text" 
              placeholder="Search discussions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-gray border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-ufc-blue"
            />
            <button className="absolute right-2 top-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div> */}
          <SignedIn>
            <button
              onClick={() => setCreatePostModalOpen(true)}
              className="bg-ufc-blue hover:bg-ufc-blue-dark flex flex-shrink-0 items-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-black transition"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Post
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton
              appearance={{
                baseTheme: dark,
                elements: {
                  formButtonPrimary: "bg-ufc-blue hover:bg-ufc-blue-dark",
                  footerActionLink: "text-ufc-blue hover:text-ufc-blue-dark",
                  // Other element customizations
                },
                variables: {
                  colorPrimary: "#25C3EC",
                  // Other color variables
                },
              }}
              mode="modal"
            >
              <button className="bg-ufc-blue hover:bg-ufc-blue-dark flex flex-shrink-0 items-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-black transition">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Post
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Category Selection */}
      <div className="mb-6 md:hidden">
        <select
          value={category}
          onChange={(e) => {
            window.location.href = `/forum/${e.target.value}`;
          }}
          className="bg-dark-gray focus:ring-ufc-blue w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1"
        >
          {FORUM_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
              {/* ({cat.count}) */}
            </option>
          ))}
        </select>
      </div>

      {/* Forum Filter Options */}
      {/* <div className="flex items-center justify-between mb-4 bg-dark-gray p-3 rounded-lg">
        <div className="flex space-x-4">
          <button 
            onClick={() => handleFilterChange("recent")}
            className={`font-medium text-sm pb-1 ${filterOption === "recent" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            Recent Activity
          </button>
          <button 
            onClick={() => handleFilterChange("popular")}
            className={`font-medium text-sm pb-1 ${filterOption === "popular" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            Most Popular
          </button>
          <button 
            onClick={() => handleFilterChange("new")}
            className={`font-medium text-sm pb-1 hidden md:block ${filterOption === "new" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            New Posts
          </button>
        </div>
        
        <div>
          <select 
            value={timeRange}
            onChange={(e) => {
              handleTimeRangeChange(e.target.value as any);
            }}
            className="bg-dark-gray text-gray-300 text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ufc-blue"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div> */}

      {/* Loading State - Initial Page Load */}
      {isLoading && page === 0 && allRegularThreads.length === 0 && (
        <div className="py-20 text-center">
          <div className="border-ufc-blue mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
          <p className="mt-4 text-gray-400">Loading discussions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="my-8 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
          <p className="text-red-500">
            Error loading threads. Please try again later.
          </p>
        </div>
      )}

      {/* Forum Thread List */}
      {(!isLoading || page > 0 || allRegularThreads.length > 0) && !error && (
        <div className="space-y-4">
          {potdThreads.length > 0 || allRegularThreads.length > 0 ? (
            <div>
              {/* POTD Section - only shown once at the top */}
              {potdThreads.length > 0 && (
                <div className="mb-6">
                  <div className="space-y-4">
                    {potdThreads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Threads Section - grows with infinite scrolling */}
              {allRegularThreads.length > 0 ? (
                <div className="space-y-4">
                  {allRegularThreads.map((thread) => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </div>
              ) : (
                !isRegularLoading &&
                page === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-gray-400">
                      No threads found with the current filters.
                    </p>
                  </div>
                )
              )}

              {/* Reference point for scroll position */}
              <div ref={loadMoreRef}></div>

              {/* Load More Button with loading state */}
              <div className="mt-6 text-center">
                {isRegularLoading && page > 0 ? (
                  <div className="py-4">
                    <div className="border-ufc-blue mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className={`rounded-lg bg-gray-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700 ${!hasMore ? "cursor-not-allowed opacity-50" : ""}`}
                    disabled={!hasMore || isRegularLoading}
                  >
                    {!hasMore ? "No More Discussions" : "Load More Discussions"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400">
                No discussions found in this category.
              </p>
              <button
                onClick={() => setCreatePostModalOpen(true)}
                className="bg-ufc-blue hover:bg-ufc-blue-dark mt-4 rounded-lg px-6 py-3 text-sm font-medium text-black transition"
              >
                Start a New Discussion
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {createPostModalOpen && (
        <CreatePostModal
          onClose={() => setCreatePostModalOpen(false)}
          categoryId={category}
        />
      )}
    </div>
  );
}
