import { useQuery } from '@tanstack/react-query';
import { AuthUser, ForumThread } from '@/lib/types';
import { fetchUserByUsername, fetchUserPosts } from '../queries/user';
import { USER_ROLES } from '@/lib/constants';

// Add a function to fetch user plan
const fetchUserPlan = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/plan`);
  if (!response.ok) {
    throw new Error('Failed to fetch user plan');
  }
  return response.json();
};

export function useUserProfile(username: string) {
  // Fetch user data
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<AuthUser>({
    queryKey: [`/api/users/username/${username}`],
    queryFn: () => fetchUserByUsername(username),
    enabled: !!username,
  });

  // Fetch user's posts
  const {
    data: userPosts,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/users/${user?.id}/posts`],
    queryFn: () => fetchUserPosts(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch user's plan status
  const {
    data: userPlan,
    isLoading: isPlanLoading,
    error: planError,
  } = useQuery<{ userId: string; username: string; planType: string }>({
    queryKey: [`/api/users/${user?.id}/plan`],
    queryFn: () => fetchUserPlan(user?.id || ''),
    enabled: !!user?.id,
  });

  const isExemptUser = user?.role === USER_ROLES.FIGHTER || user?.role === USER_ROLES.INDUSTRY_PROFESSIONAL || user?.role === USER_ROLES.ADMIN|| user?.role === USER_ROLES.MODERATOR;

  return {
    user,
    isUserLoading,
    userError,
    userPosts,
    isPostsLoading,
    postsError,
    userPlan,
    isPlanLoading,
    planError,
    // Helper function to check if user has paid plan
    hasPaidPlan: userPlan?.planType && userPlan.planType !== 'FREE' || isExemptUser,
    // Helper function to get plan type
    planType: userPlan?.planType || 'FREE',
  };
} 