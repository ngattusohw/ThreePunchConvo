import { useState } from "react";
import { Link } from "wouter";
import ThreadCard from "@/components/forum/ThreadCard";
import { useQuery } from "@tanstack/react-query";
import { ForumThread, ForumCategory } from "@/lib/types";
import { FORUM_CATEGORIES } from "@/lib/constants";
import CreatePostModal from "@/components/forum/CreatePostModal";

interface ForumContentProps {
  category?: string;
}

export default function ForumContent({ category = "general" }: ForumContentProps) {
  const [filterOption, setFilterOption] = useState<"recent" | "popular" | "new">("recent");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">("all");
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get the current category info
  const currentCategory = FORUM_CATEGORIES.find(cat => cat.id === category) || FORUM_CATEGORIES[0];
  
  // Fetch threads for the current category
  const { data: threads, isLoading, error } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, filterOption, timeRange],
    // In a real app, we would fetch from the API here
    // For now, we'll return mock data via a default queryFn
  });
  
  // For demonstration, we'll create mock threads if none are returned from the API
  const displayThreads = threads?.length ? threads : generateMockThreads(currentCategory);

  return (
    <div className="flex-grow">
      {/* Forum Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">{currentCategory.name}</h1>
          <p className="text-gray-400 text-sm">{currentCategory.description}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search discussions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-gray border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-ufc-red"
            />
            <button className="absolute right-2 top-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          <button 
            onClick={() => setCreatePostModalOpen(true)}
            className="bg-ufc-red hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center transition"
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
          className="bg-dark-gray border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-ufc-red"
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
            onClick={() => setFilterOption("recent")}
            className={`font-medium text-sm pb-1 ${filterOption === "recent" ? "text-white border-b-2 border-ufc-red" : "text-gray-400 hover:text-white"}`}
          >
            Recent Activity
          </button>
          <button 
            onClick={() => setFilterOption("popular")}
            className={`font-medium text-sm pb-1 ${filterOption === "popular" ? "text-white border-b-2 border-ufc-red" : "text-gray-400 hover:text-white"}`}
          >
            Most Popular
          </button>
          <button 
            onClick={() => setFilterOption("new")}
            className={`font-medium text-sm pb-1 hidden md:block ${filterOption === "new" ? "text-white border-b-2 border-ufc-red" : "text-gray-400 hover:text-white"}`}
          >
            New Posts
          </button>
        </div>
        
        <div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-dark-gray text-gray-300 text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ufc-red"
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
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
          {displayThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
          
          {/* Load More Button */}
          <div className="mt-6 text-center">
            <button className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg text-sm transition">
              Load More Discussions
            </button>
          </div>
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

// Helper function to generate mock threads for demonstration
function generateMockThreads(category: ForumCategory): ForumThread[] {
  // This is for demonstration only - in a real app, we'd fetch from the API
  const baseUsers = [
    {
      id: 1,
      username: "OctagonInsider",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
      status: "HALL OF FAMER" as const,
      isOnline: true,
      postsCount: 157, 
      likesCount: 3200,
      potdCount: 12,
      rank: 1,
      followersCount: 420,
      followingCount: 63,
      role: "ADMIN" as const,
    },
    {
      id: 2,
      username: "KnockoutKing",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
      status: "CHAMPION" as const,
      isOnline: true,
      postsCount: 94,
      likesCount: 1203,
      potdCount: 8,
      rank: 2,
      followersCount: 215,
      followingCount: 44,
      role: "USER" as const,
    },
    {
      id: 3,
      username: "DustinPoirier",
      avatar: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
      status: "HALL OF FAMER" as const,
      isOnline: true,
      postsCount: 73,
      likesCount: 4120,
      potdCount: 14,
      rank: 1,
      followersCount: 1200,
      followingCount: 23,
      role: "PRO" as const,
    },
    {
      id: 4,
      username: "GrappleGuru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
      status: "RANKED POSTER" as const,
      isOnline: true,
      postsCount: 42,
      likesCount: 430,
      potdCount: 2,
      rank: 12,
      followersCount: 38,
      followingCount: 126,
      role: "USER" as const,
    },
    {
      id: 5,
      username: "StrikingQueen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
      status: "CONTENDER" as const,
      isOnline: true,
      postsCount: 68,
      likesCount: 784,
      potdCount: 4,
      rank: 5,
      followersCount: 92,
      followingCount: 104,
      role: "USER" as const,
    },
  ];

  const threads = [
    {
      id: 1,
      title: "Welcome to 3 Punch Convo - Rules & Guidelines",
      content: "Welcome to our community! Please read our rules before posting. We aim to keep discussions respectful and on-topic. Any violation may result in post removal or account suspension.",
      userId: 1,
      user: baseUsers[0],
      categoryId: "general",
      isPinned: true,
      isLocked: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      viewCount: 3200,
      likesCount: 147,
      dislikesCount: 0,
      repliesCount: 24,
      isPotd: false,
    },
    {
      id: 2,
      title: "Jones vs Aspinall: Who would win and why?",
      content: "With Aspinall taking the interim title, a unification bout with Jones seems inevitable. Let's break down who would win this dream matchup and why. Personally, I think Aspinall's speed gives Jones problems but Jon's experience edge is significant.",
      userId: 2,
      user: baseUsers[1],
      categoryId: "ufc",
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      viewCount: 1800,
      likesCount: 324,
      dislikesCount: 42,
      repliesCount: 86,
      isPotd: true,
      poll: {
        id: 1,
        threadId: 2,
        question: "Who wins this matchup?",
        options: [
          { id: 1, pollId: 1, text: "Jon Jones", votesCount: 156 },
          { id: 2, pollId: 1, text: "Tom Aspinall", votesCount: 87 },
        ],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        votesCount: 243,
      },
    },
    {
      id: 3,
      title: "My thoughts on the upcoming UFC 300 card",
      content: "Hey everyone! Just wanted to share some of my thoughts on the upcoming UFC 300 card. I think we're going to see some incredible matchups, and I'm particularly excited about the lightweight bout between...",
      userId: 3,
      user: baseUsers[2],
      categoryId: "ufc",
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      viewCount: 4700,
      likesCount: 1200,
      dislikesCount: 28,
      repliesCount: 352,
      isPotd: false,
      media: [
        { 
          id: 1, 
          threadId: 3, 
          type: "IMAGE", 
          url: "https://images.unsplash.com/photo-1622529888226-5592be2a16be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
        }
      ],
    },
    {
      id: 4,
      title: "This submission sequence from last night was insane!",
      content: "Check out this incredible transition from armbar to triangle. The level of grappling in MMA has evolved so much in the past few years. What do you all think of this sequence?",
      userId: 4,
      user: baseUsers[3],
      categoryId: "techniques",
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      viewCount: 2300,
      likesCount: 412,
      dislikesCount: 19,
      repliesCount: 78,
      isPotd: false,
      media: [
        { 
          id: 2, 
          threadId: 4, 
          type: "GIF", 
          url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
        }
      ],
    },
    {
      id: 5,
      title: "Who are your top 5 female fighters of all time?",
      content: "With all the discussion about GOATs, I'm curious to hear your picks for the top 5 female fighters in MMA history. My list would have to include Nunes, Shevchenko, Jedrzejczyk, Cyborg, and probably Rousey for her impact on the sport. What about you?",
      userId: 5,
      user: baseUsers[4],
      categoryId: "general",
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      viewCount: 1500,
      likesCount: 287,
      dislikesCount: 31,
      repliesCount: 124,
      isPotd: false,
    },
  ];

  // Filter threads by category
  return threads.filter(thread => thread.categoryId === category.id || category.id === "general");
}
