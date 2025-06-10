import { useQuery } from '@tanstack/react-query';
import { ForumThread } from '@/lib/types';
import { fetchPinnedThreads } from '../../../queries/thread';

interface UsePinnedThreadsOptions {
  category: string;
}

export function usePinnedThreads({ category }: UsePinnedThreadsOptions) {
  // Query for Pinned threads
  const { 
    data: pinnedThreads = [], 
    isLoading: isPinnedLoading,
    error 
  } = useQuery<ForumThread[]>({
    queryKey: [`/api/threads/${category}`, 'pinned'],
    queryFn: () => fetchPinnedThreads(category),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    pinnedThreads,
    isPinnedLoading,
    error
  };
} 