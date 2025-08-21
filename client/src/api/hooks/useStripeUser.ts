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

export interface StripeSubscription {
  id: string;
  status: string;
  planId: string;
  customerId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  discounts: string[];
  billingCycle?: string;
  billingPrice?: string;
  billingInterval?: string;
}

export interface StripeSubscriptionsResponse {
  subscriptions: StripeSubscription[];
}

const fetchStripeSubscriptions = async (
  customerId: string,
  status: string = "active",
): Promise<StripeSubscriptionsResponse> => {
  console.log("fetching subscriptions", customerId, status);
  const response = await apiRequest(
    "GET",
    `/get-subscriptions?customerId=${customerId}&status=${status}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Stripe subscriptions");
  }

  return response.json();
};

export function useStripeSubscriptions(
  customerId: string,
  status: string = "active",
) {
  const {
    data: subscriptionsData,
    isLoading,
    error,
    refetch,
  } = useQuery<StripeSubscriptionsResponse>({
    queryKey: ["stripe-subscriptions", customerId, status],
    queryFn: () => fetchStripeSubscriptions(customerId, status),
    enabled: !!customerId,
    retry: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    subscriptions: subscriptionsData?.subscriptions || [],
    isLoading,
    error,
    refetch,
  };
}
