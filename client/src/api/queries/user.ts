import { AuthUser, ForumThread, RankedUser } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchTopUsers = async () => {
  const response = await apiRequest(
    "GET",
    "/api/users/top"
  );

  if (!response.ok) {
    throw new Error('Failed to fetch top users');
  }
  
  return response.json() as Promise<RankedUser[]>;
};

export const fetchUserByUsername = async (username: string) => {
  try {
    const response = await apiRequest("GET", `/api/users/username/${username}`);
    
    if (response instanceof Response) {
      return await response.json() as AuthUser;
    }
    
    return response as AuthUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const fetchUserPosts = async (userId: string) => {
  if (!userId) return [];
  
  try {
    const response = await apiRequest("GET", `/api/users/${userId}/posts`);
    
    if (response instanceof Response) {
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }
      
      return data as ForumThread[];
    }
    
    if (!Array.isArray(response)) {
      console.error("Invalid response format:", response);
      throw new Error("Invalid response format from server");
    }
    
    return response as ForumThread[];
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
}; 