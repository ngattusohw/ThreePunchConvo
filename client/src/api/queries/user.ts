import { RankedUser } from "@/lib/types";
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