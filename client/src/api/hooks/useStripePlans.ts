import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  planType: string;
  features: string[];
  price: number;
}

export interface StripePlansResponse {
  plans: StripePlan[];
}

const fetchStripePlans = async (): Promise<StripePlansResponse> => {
  const response = await apiRequest("GET", "/get-plans");

  if (!response.ok) {
    throw new Error("Failed to fetch Stripe plans");
  }

  return response.json();
};

export function useStripePlans() {
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useQuery<StripePlansResponse>({
    queryKey: ["stripe-plans"],
    queryFn: fetchStripePlans,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    plans: plansData?.plans || [],
    isLoading,
    error,
    refetch,
  };
}
