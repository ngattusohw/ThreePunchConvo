import { AuthUser, ForumThread, RankedUser } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchTopUsers = async () => {
  const response = await apiRequest("GET", "/api/users/top");

  if (!response.ok) {
    throw new Error("Failed to fetch top users");
  }

  return response.json() as Promise<RankedUser[]>;
};

export const fetchUserByUsername = async (username: string) => {
  try {
    const response = await apiRequest("GET", `/api/users/username/${username}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("User not found");
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return (await response.json()) as AuthUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const fetchUserPosts = async (userId: string) => {
  if (!userId) return [];

  try {
    const response = await apiRequest("GET", `/api/users/${userId}/posts`);

    if (response instanceof Response) {
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }

      return data as ForumThread[];
    }

    if (!Array.isArray(response)) {
      console.error("Invalid response format:", response);
      throw new Error("Invalid response format from server");
    }

    return response as ForumThread[];
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
};

/**
 * Fetch a user's Fight Cred score
 *
 * @param userId - The ID of the user to fetch the score for
 * @returns The Fight Cred score for the user
 */
export const fetchUserFightCred = async (userId: string): Promise<number> => {
  if (!userId) throw new Error("User ID is required");

  try {
    // Since the Fight Cred is equivalent to the rank in the AuthUser,
    // we can fetch the user and return the rank
    const response = await apiRequest("GET", `/api/users/${userId}`);

    if (response instanceof Response) {
      const user = (await response.json()) as AuthUser;
      return user.rank;
    }

    return (response as AuthUser).rank;
  } catch (error) {
    console.error("Error fetching user Fight Cred:", error);
    throw error;
  }
};

/**
 * Create a Stripe customer portal session for billing management
 *
 * @param customerId - The Stripe customer ID
 * @returns The URL to redirect to for the customer portal
 */
export const createCustomerPortalSession = async (
  customerId: string,
): Promise<string> => {
  if (!customerId) throw new Error("Customer ID is required");

  try {
    const response = await apiRequest("POST", "/create-portal-session", {
      customerId,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create portal session");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    throw error;
  }
};

/**
 * Delete user account from the database
 *
 * @param userId - The Clerk user ID to delete
 * @returns Promise that resolves when the account is deleted
 */
export const deleteAccount = async (userId: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required");

  try {
    const response = await apiRequest("DELETE", "/api/users/account", {
      userId,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete account");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};
