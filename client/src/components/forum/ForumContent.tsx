import { useState } from "react";
import { Link } from "wouter";
import ThreadCard from "@/components/forum/ThreadCard";
import { useQuery } from "@tanstack/react-query";
import { ForumThread, ForumCategory, UserStatus } from "@/lib/types";
import { FORUM_CATEGORIES } from "@/lib/constants";
import CreatePostModal from "@/components/forum/CreatePostModal";
import { formatDistanceToNow } from "date-fns";

interface ForumContentProps {
  category?: string;
}

export default function ForumContent({ category = "general" }: ForumContentProps) {
  const [filterOption, setFilterOption] = useState<"recent" | "popular" | "new">("recent");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">("all");
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;
  
  // Get the current category info
  const currentCategory = FORUM_CATEGORIES.find(cat => cat.id === category) || FORUM_CATEGORIES[0];
  
  // Query for POTD threads
  const { 
    data: potdThreads = [], 
    isLoading: isPotdLoading 
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, 'potd'],
    queryFn: async () => {
      const params = new URLSearchParams({
        potdFilter: 'only',
        sort: 'recent'
      });
      const response = await fetch(`/api/threads/${category}?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch POTD threads');
      }
      return response.json();
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  
  // Query for regular threads (non-POTD)
  const { 
    data: regularThreads = [], 
    isLoading: isRegularLoading,
    error,
    refetch: refetchRegularThreads
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, filterOption, timeRange, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        potdFilter: 'exclude',
        sort: filterOption,
        timeRange: timeRange,
        limit: String(limit),
        offset: String(page * limit)
      });
      const response = await fetch(`/api/threads/${category}?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch regular threads');
      }
      return response.json();
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  
  // Combine POTD and regular threads
  const threads = [...potdThreads, ...regularThreads];
  const isLoading = isPotdLoading || isRegularLoading;
  
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <div className="flex-grow">
      {/* Forum Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
        <div className="md:max-w-[70%]">
          <h1 className="text-2xl font-heading font-bold text-white mb-1">{currentCategory.name}</h1>
          <p className="text-gray-400 text-sm">{currentCategory.description}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
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
          
          <button 
            onClick={() => setCreatePostModalOpen(true)}
            className="bg-ufc-blue hover:bg-ufc-blue-dark text-black font-medium px-4 py-2 rounded-lg text-sm flex-shrink-0 flex items-center transition whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>
        </div>
      </div>
      
      {/* Mobile Category Selection */}
      <div className="md:hidden mb-6">
        <select 
          value={category}
          onChange={(e) => {
            window.location.href = `/forum/${e.target.value}`;
          }}
          className="bg-dark-gray border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-ufc-blue"
        >
          {FORUM_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Forum Filter Options */}
      <div className="flex items-center justify-between mb-4 bg-dark-gray p-3 rounded-lg">
        <div className="flex space-x-4">
          <button 
            onClick={() => {
              setFilterOption("recent");
              setPage(0); // Reset page on filter change
            }}
            className={`font-medium text-sm pb-1 ${filterOption === "recent" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            Recent Activity
          </button>
          <button 
            onClick={() => {
              setFilterOption("popular");
              setPage(0); // Reset page on filter change
            }}
            className={`font-medium text-sm pb-1 ${filterOption === "popular" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            Most Popular
          </button>
          <button 
            onClick={() => {
              setFilterOption("new");
              setPage(0); // Reset page on filter change
            }}
            className={`font-medium text-sm pb-1 hidden md:block ${filterOption === "new" ? "text-white border-b-2 border-ufc-blue" : "text-gray-400 hover:text-white"}`}
          >
            New Posts
          </button>
        </div>
        
        <div>
          <select 
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value as any);
              setPage(0); // Reset page on time range change
            }}
            className="bg-dark-gray text-gray-300 text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ufc-blue"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading discussions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center my-8">
          <p className="text-red-500">Error loading threads. Please try again later.</p>
        </div>
      )}

      {/* Forum Thread List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {threads.length > 0 ? (
            <div>
              {/* POTD Section */}
              {potdThreads.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-ufc-blue mb-2">Posts of the Day</div>
                  <div className="space-y-4">
                    {potdThreads.map(thread => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Threads Section */}
              {regularThreads.length > 0 && (
                <div className="space-y-4">
                  {regularThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </div>
              )}
              
              {/* Load More Button */}
              <div className="mt-6 text-center">
                <button 
                  onClick={loadMore}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg text-sm transition"
                >
                  Load More Discussions
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No discussions found in this category.</p>
              <button 
                onClick={() => setCreatePostModalOpen(true)}
                className="mt-4 bg-ufc-blue hover:bg-ufc-blue-dark text-black font-medium px-6 py-3 rounded-lg text-sm transition"
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


