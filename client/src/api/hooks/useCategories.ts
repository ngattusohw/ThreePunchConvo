import { useQuery } from '@tanstack/react-query';
import { ForumCategory } from '@/lib/types';
import { fetchCategories } from '../queries/thread';

export function useCategories() {
  const { 
    data: categories = [], 
    isLoading,
    error 
  } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories'],
    queryFn: fetchCategories,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    categories,
    isLoading,
    error
  };
} 