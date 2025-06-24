import { useQuery } from "@tanstack/react-query";
import { RankedUser } from "@/lib/types";
import { fetchTopUsers } from "../queries/user";

export function useTopUsers() {
  const {
    data: topUsers,
    isLoading,
    error,
  } = useQuery<RankedUser[]>({
    queryKey: ["/api/users/top"],
    queryFn: fetchTopUsers,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    topUsers,
    isLoading,
    error,
  };
}
