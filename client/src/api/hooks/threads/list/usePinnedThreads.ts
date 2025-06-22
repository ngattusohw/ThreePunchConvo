import { useQuery } from '@tanstack/react-query';
import { ForumThread } from '@/lib/types';
import { fetchPinnedThreads } from '../../../queries/thread';

interface UsePinnedThreadsOptions {
  category: string;
  userId?: string;
}

export function usePinnedThreads({ category, userId }: UsePinnedThreadsOptions) {
  // Query for Pinned threads
  const { 
    data: pinnedThreads = [], 
    isLoading: isPinnedLoading,
    error 
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, 'pinned', userId],
    queryFn: () => fetchPinnedThreads(category, userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes - pinned threads don't change often
  });

  return {
    pinnedThreads,
    isPinnedLoading,
    error
  };
} 