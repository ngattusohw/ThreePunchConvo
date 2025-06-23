import { useQuery } from '@tanstack/react-query';
import { useMemoizedUser } from '@/hooks/useMemoizedUser';

// Function to fetch local user by Clerk ID
const fetchLocalUserByClerkId = async (clerkId: string) => {
  const response = await fetch(`/api/users/clerk/${clerkId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch local user');
  }
  return response.json();
};

export function useLocalUser() {
  const { user: clerkUser } = useMemoizedUser();
  
  const {
    data: localUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['localUser', clerkUser?.id],
    queryFn: () => fetchLocalUserByClerkId(clerkUser!.id),
    enabled: !!clerkUser?.id,
  });

  return {
    localUser,
    isLoading,
    error,
  };
} 