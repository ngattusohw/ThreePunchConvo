import { useState, useEffect, useRef } from "react";
import ThreadCard from "@/components/forum/ThreadCard";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useThreadsList } from "@/api/hooks/threads";

interface ForumContentProps {
  category?: string;
  onOpenModal?: () => void;
  modalOpen?: boolean;
}

export default function ForumContent({
  category = "general",
  onOpenModal,
  modalOpen = false,
}: ForumContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  
  // Debug: Track when ForumContent re-renders
  useEffect(() => {
    console.log('ForumContent re-rendered, modal state:', modalOpen);
  });

  // Debug: Track modal state changes
  useEffect(() => {
    console.log('Modal state changed in ForumContent:', modalOpen);
  }, [modalOpen]);

  // Debug: Track category changes
  useEffect(() => {
    console.log('Category changed in ForumContent:', category);
  }, [category]);

  // Get the current category info
  const currentCategory = FORUM_CATEGORIES.find(cat => cat.id === category) || FORUM_CATEGORIES[0];
  
  // Use the thread hook
  const {
    pinnedThreads,
    regularThreads: allRegularThreads,
    isLoading,
    error,
    hasMore,
    page,
    loadMore,
    filterOption,
    timeRange,
    handleFilterChange,
    handleTimeRangeChange
  } = useThreadsList({
    category,
    initialFilterOption: "recent",
    initialTimeRange: "all"
  });

  // Store current scroll position before loading more
  const handleLoadMore = () => {
    // Save current scroll position before loading more
    scrollPositionRef.current = window.scrollY;
    loadMore();
  };

  // Maintain scroll position when new content is loaded
  useEffect(() => {
    if (page > 0 && scrollPositionRef.current > 0) {
      // Restore the previous scroll position
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: "auto",
      });
    }
  }, [allRegularThreads, page]);

  // Use parent's modal handler or fallback to console log
  const handleOpenModal = () => {
    console.log('Modal open requested in ForumContent');
    if (onOpenModal) {
      onOpenModal();
    } else {
      console.warn('No onOpenModal handler provided to ForumContent');
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
              onClick={handleOpenModal}
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
          {(pinnedThreads.length > 0 || allRegularThreads.length > 0) ? (
            <div>
              {/* Pinned Section - only shown once at the top */}
              {pinnedThreads.length > 0 && (
                <div className="mb-6">
                  <div className="space-y-4">
                    {pinnedThreads.map(thread => (
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
                !isLoading &&
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
                {isLoading && page > 0 ? (
                  <div className="py-4">
                    <div className="border-ufc-blue mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className={`rounded-lg bg-gray-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700 ${!hasMore ? "cursor-not-allowed opacity-50" : ""}`}
                    disabled={!hasMore || isLoading}
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
                onClick={handleOpenModal}
                className="bg-ufc-blue hover:bg-ufc-blue-dark mt-4 rounded-lg px-6 py-3 text-sm font-medium text-black transition"
              >
                Start a New Discussion
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
