import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthUser, ForumThread } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import ThreadCard from "@/components/forum/ThreadCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Fetch user data
  const { data: user, isLoading: isUserLoading, error: userError } = useQuery<AuthUser>({
    queryKey: [`/api/users/username/${username}`],
    // In a real app, we would fetch from the API
  });
  
  // Fetch user's posts
  const { data: userPosts, isLoading: isPostsLoading, error: postsError } = useQuery<ForumThread[]>({
    queryKey: [`/api/users/${user?.id}/posts`],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/posts`);
        if (response instanceof Response) {
          const data = await response.json();
          console.log("user posts data:", data);
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format from server');
          }
          return data;
        }
        if (!Array.isArray(response)) {
          console.error('Invalid response format:', response);
          throw new Error('Invalid response format from server');
        }
        return response;
      } catch (error) {
        console.error('Error fetching user posts:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
  
  // Check if current user follows this user
  // useEffect(() => {
  //   if (currentUser && user) {
  //     // In a real app, we would check this via API
  //     setIsFollowing(Math.random() > 0.5); // Mock implementation
  //   }
  // }, [currentUser, user]);
  
  // For demo purposes, create mock user if none is returned from the API
  const displayUser = user;
  
  // Use actual posts data or empty array if no posts
  const displayPosts = userPosts || [];
  
  // Handle follow/unfollow
  // const handleFollowToggle = async () => {
  //   if (!currentUser) {
  //     toast({
  //       title: "Authentication Required",
  //       description: "You must be logged in to follow users.",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
    
  //   try {
  //     if (isFollowing) {
  //       // Unfollow user
  //       await apiRequest("POST", `/api/users/${displayUser.id}/unfollow`, {
  //         followerId: currentUser.id
  //       });
  //       setIsFollowing(false);
  //       toast({
  //         title: "Success",
  //         description: `You have unfollowed ${displayUser.username}.`,
  //       });
  //     } else {
  //       // Follow user
  //       await apiRequest("POST", `/api/users/${displayUser.id}/follow`, {
  //         followerId: currentUser.id
  //       });
  //       setIsFollowing(true);
  //       toast({
  //         title: "Success",
  //         description: `You are now following ${displayUser.username}.`,
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to update follow status. Please try again.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // Loading state
  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-red"></div>
      </div>
    );
  }
  
  // Error state
  if (userError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-500">Error loading user profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-dark-gray rounded-lg overflow-hidden shadow-lg">
        {/* Banner and Avatar */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-ufc-black to-ufc-red relative">
          <div className="absolute -bottom-12 left-4 md:left-8">
            <UserAvatar user={displayUser} size="xl" />
          </div>
        </div>
        
        {/* User Info and Actions */}
        <div className="pt-16 px-4 md:px-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white">{displayUser.username}</h1>
              
              {displayUser.role === "PRO" && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  VERIFIED
                </span>
              )}
              
              {displayUser.role === "ADMIN" && (
                <span className="bg-ufc-gold text-ufc-black text-xs px-2 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              )}
              
              {displayUser.role === "MODERATOR" && (
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">
                  MOD
                </span>
              )}
              
              <StatusBadge status={displayUser.status} />
            </div>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {displayUser.postsCount} posts
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {displayUser.likesCount} likes
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-ufc-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {displayUser.potdCount} POTD
              </div>
            </div>
            
            {/* <div className="flex items-center space-x-4 mt-2 text-sm">
              <button 
                className="text-ufc-red hover:underline"
                onClick={() => 
              >
                <span className="font-bold">{displayUser.followersCount}</span> followers
              </button>
              <button 
                className="text-ufc-red hover:underline"
                onClick={() =>
              >
                <span className="font-bold">{displayUser.followingCount}</span> following
              </button>
            </div> */}
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            {/* {currentUser && currentUser.id !== displayUser.id && (
              <button 
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isFollowing 
                    ? "bg-gray-700 text-white hover:bg-gray-600" 
                    : "bg-ufc-red text-white hover:bg-red-700"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            
            {currentUser && currentUser.id !== displayUser.id && (
              <button className="bg-dark-gray border border-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition">
                Message
              </button>
            )} */}
            
            {/* Edit Profile */}
            {/* {currentUser && currentUser.id === displayUser.id && (
              <button className="bg-dark-gray border border-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition">
                Edit Profile
              </button>
            )} */}
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="mt-6 border-b border-gray-800">
        <div className="flex space-x-8">
          <button 
            onClick={() => setActiveTab("posts")}
            className={`pb-4 font-medium text-sm transition ${
              activeTab === "posts" 
                ? "text-white border-b-2 border-ufc-red" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Posts
          </button>
          <button 
            onClick={() => setActiveTab("about")}
            className={`pb-4 font-medium text-sm transition ${
              activeTab === "about" 
                ? "text-white border-b-2 border-ufc-red" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            About
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "posts" && (
          <>
            {isPostsLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading posts...</p>
              </div>
            ) : postsError ? (
              <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
                <p className="text-red-500">Error loading posts. Please try again later.</p>
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="py-12 text-center bg-dark-gray rounded-lg">
                <p className="text-gray-400">This user hasn't posted anything yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayPosts.map(post => (
                  <ThreadCard key={post.id} thread={post} />
                ))}
              </div>
            )}
          </>
        )}
        
        {activeTab === "about" && (
          <div className="bg-dark-gray rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">About {displayUser.username}</h2>
            
            {/* Rank & Status */}
            <div className="mb-6">
              <h3 className="text-gray-400 font-medium mb-2">Rank & Status</h3>
              <div className="flex items-center space-x-4 mb-2">
                <div className="bg-gray-800 px-3 py-2 rounded-lg">
                  <span className="block text-white font-bold text-xl">#{displayUser.rank}</span>
                  <span className="text-gray-400 text-xs">Community Rank</span>
                </div>
                <div className="bg-gray-800 px-3 py-2 rounded-lg">
                  <StatusBadge status={displayUser.status} className="mb-1" />
                  <span className="text-gray-400 text-xs">Current Status</span>
                </div>
              </div>
            </div>
            
            {/* Activity Stats */}
            <div className="mb-6">
              <h3 className="text-gray-400 font-medium mb-2">Activity Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold text-xl">{displayUser.postsCount}</span>
                  <span className="text-gray-400 text-sm">Posts</span>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold text-xl">{displayUser.likesCount}</span>
                  <span className="text-gray-400 text-sm">Likes Received</span>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold text-xl">{displayUser.potdCount}</span>
                  <span className="text-gray-400 text-sm">Post of the Day</span>
                </div>
                {/* <div className="bg-gray-800 p-3 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold text-xl">{displayUser.followersCount}</span>
                  <span className="text-gray-400 text-sm">Followers</span>
                </div> */}
              </div>
            </div>
            
            {/* Social Media  TODO implement */}
            {displayUser.socialLinks && Object.keys(displayUser.socialLinks).length > 0 && (
              <div>
                <h3 className="text-gray-400 font-medium mb-2">Connect with {displayUser.username}</h3>
                <div className="flex space-x-4">
                  {displayUser.socialLinks.twitter && (
                    <a href={displayUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                  )}
                  {displayUser.socialLinks.instagram && (
                    <a href={displayUser.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {displayUser.socialLinks.youtube && (
                    <a href={displayUser.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </a>
                  )}
                  {displayUser.socialLinks.facebook && (
                    <a href={displayUser.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
