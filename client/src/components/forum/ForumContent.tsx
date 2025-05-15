import { useState } from "react";
import { Link } from "wouter";
import ThreadCard from "@/components/forum/ThreadCard";
import { useQuery } from "@tanstack/react-query";
import { ForumThread, ForumCategory, UserStatus } from "@/lib/types";
import { FORUM_CATEGORIES } from "@/lib/constants";
import CreatePostModal from "@/components/forum/CreatePostModal";
import { formatDistanceToNow } from "date-fns";

// Function to generate mock threads
function generateMockThreads(currentCategory: any): ForumThread[] {
  const mockAuthors = [
    { id: "1", username: "UFCFanatic", avatarUrl: null, points: 3450, status: "HALL OF FAMER" },
    { id: "2", username: "MMAExpert", avatarUrl: null, points: 2100, status: "CHAMPION" },
    { id: "3", username: "FightScience", avatarUrl: null, points: 1850, status: "CONTENDER" },
    { id: "4", username: "OctagonInsider", avatarUrl: null, points: 980, status: "AMATEUR" },
    { id: "5", username: "KnockoutKing", avatarUrl: null, points: 1200, status: "COMPETITOR" }
  ];
  
  const generateRandomDate = () => {
    const now = Date.now();
    const randomTime = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time within last month
    return new Date(now - randomTime);
  };
  
  const titles = {
    general: [
      "Welcome to 3 Punch Convo! Introduce yourself here",
      "What got you into MMA? Share your story",
      "Best way to watch fights - TV, Phone, or Live?",
      "Who's the GOAT debate - let's settle this once and for all",
      "Most anticipated fight of the year?"
    ],
    ufc: [
      "UFC 300 card predictions and discussion",
      "Jon Jones vs Stipe - Will it ever happen?",
      "Dana White announces new UFC APEX expansion",
      "Alex Pereira - Could he become double champ?",
      "Sean O'Malley's next title defense - who's it going to be?"
    ],
    bellator: [
      "Bellator-PFL merger: Good or bad for fighters?",
      "Patricio Pitbull legacy discussion",
      "Best Bellator event of all time?",
      "Bellator's heavyweight division analysis",
      "Ryan Bader vs Fedor - rematch possibility?"
    ],
    one: [
      "ONE Championship expanding to US market",
      "Rodtang vs Takeru - Who wins and how?",
      "Stamp Fairtex impressive run as champion",
      "Best Muay Thai fights in ONE history",
      "Demetrious Johnson's career at ONE"
    ],
    pfl: [
      "PFL $1M tournament format discussion",
      "Kayla Harrison's dominance - good or bad for PFL?",
      "PFL's new broadcast deal analysis",
      "Best prospects to watch in this PFL season",
      "Could the PFL champions compete in the UFC?"
    ],
    boxing: [
      "Fury vs Usyk - unified heavyweight championship",
      "Canelo's next opponent prediction thread",
      "Ryan Garcia comeback strategy",
      "Is Jake Paul good for boxing?",
      "Women's boxing getting more spotlight - thoughts?"
    ],
    techniques: [
      "Southpaw vs Orthodox - Best strategies",
      "Takedown defense fundamentals - share your tips",
      "Calf kick counter techniques - what works?",
      "How to improve punching power - scientific approach",
      "Best conditioning exercises for MMA fighters"
    ],
    offtopic: [
      "MMA video games - which one is your favorite?",
      "Favorite fighter entrances of all time",
      "Share your home workout setup for MMA training",
      "Sports betting strategies thread",
      "Best MMA documentaries to watch"
    ]
  };
  
  const mockThreads: ForumThread[] = [];
  
  // Get the appropriate titles for the current category
  const categoryTitles = titles[currentCategory.id as keyof typeof titles] || titles.general;
  
  for (let i = 0; i < 5; i++) {
    const author = mockAuthors[i % mockAuthors.length];
    const createdAt = generateRandomDate();
    
    mockThreads.push({
      id: `mock_${1000 + i}`,
      title: categoryTitles[i],
      content: `This is a mock discussion about ${categoryTitles[i].toLowerCase()}. Join the conversation!`,
      userId: author.id,
      categoryId: currentCategory.id,
      isPinned: i === 0,
      isLocked: false,
      viewCount: Math.floor(Math.random() * 1000) + 100,
      repliesCount: Math.floor(Math.random() * 50) + 5,
      lastActivityAt: new Date(),
      createdAt,
      updatedAt: createdAt,
      isPotd: i === 1,
      user: {
        id: author.id,
        username: author.username,
        avatar: author.avatarUrl || undefined,
        status: author.status as UserStatus,
        isOnline: true,
        postsCount: Math.floor(Math.random() * 100) + 10,
        likesCount: Math.floor(Math.random() * 300) + 50,
        potdCount: Math.floor(Math.random() * 5),
        rank: i + 1,
        followersCount: Math.floor(Math.random() * 50) + 10,
        followingCount: Math.floor(Math.random() * 30) + 5,
        role: i === 0 ? "ADMIN" : "USER",
      },
      poll: i === 1 ? {
        id: "mock_poll_1",
        threadId: `mock_${1000 + i}`,
        question: "Who will win?",
        options: [
          { id: "1", pollId: "mock_poll_1", text: "Fighter A", votesCount: 24 },
          { id: "2", pollId: "mock_poll_1", text: "Fighter B", votesCount: 18 }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        votesCount: 42
      } : undefined,
      likesCount: Math.floor(Math.random() * 30) + 5,
      dislikesCount: Math.floor(Math.random() * 10)
    });
  }
  
  return mockThreads;
}

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
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: filterOption,
        timeRange: timeRange,
        limit: '10',
        offset: '0'
      });
      const response = await fetch(`/api/threads/${category}?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      return response.json();
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  
  // Generate mock threads if none are returned from the API
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


