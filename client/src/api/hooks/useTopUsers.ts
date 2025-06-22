import { useQuery } from '@tanstack/react-query';
import { RankedUser } from '@/lib/types';
import { fetchTopUsers } from '../queries/user';

export function useTopUsers() {
  const {
    data: topUsers,
    isLoading,
    error,
  } = useQuery<RankedUser[]>({
    queryKey: ['/api/users/top'],
    queryFn: fetchTopUsers,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 10 * 60 * 1000, // 10 minutes - top users don't change frequently
  });

  return {
    topUsers,
    isLoading,
    error,
  };
} 