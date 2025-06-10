import { useQuery } from '@tanstack/react-query';
import { AuthUser, ForumThread } from '@/lib/types';
import { fetchUserByUsername, fetchUserPosts } from '../queries/user';

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

  return {
    user,
    isUserLoading,
    userError,
    userPosts,
    isPostsLoading,
    postsError,
  };
} 