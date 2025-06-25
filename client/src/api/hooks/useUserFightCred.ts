import { useQuery } from "@tanstack/react-query";
import { fetchUserFightCred } from "../queries/user";

/**
 * Hook to fetch a user's Fight Cred score
 * @param userId The ID of the user to fetch the Fight Cred for
 * @returns An object containing the Fight Cred score and loading/error states
 */
export function useUserFightCred(userId: string) {
  const {
    data: fightCred,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/users/${userId}/fightcred`],
    queryFn: () => fetchUserFightCred(userId),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  return {
    fightCred,
    isLoading,
    error,
  };
}
