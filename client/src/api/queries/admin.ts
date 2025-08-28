import { AdminUsersResponse, AdminUsersFilters } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchUsers = async (
  filters: AdminUsersFilters,
): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const response = await apiRequest("GET", `/api/users?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch users for admin view");
  }

  return response.json() as Promise<AdminUsersResponse>;
};

export const updateUserRole = async (
  userId: string,
  role: string,
): Promise<void> => {
  const response = await apiRequest("PUT", `/api/users/${userId}/role`, {
    role,
  });

  if (!response.ok) {
    throw new Error("Failed to update user role");
  }
};

export const sendMessageToUser = async (
  userId: string,
  message: string,
): Promise<void> => {
  const response = await apiRequest("POST", "/api/admin/message-user", {
    targetUserId: userId,
    message,
  });

  if (!response.ok) {
    throw new Error("Failed to send message to user");
  }
};

export const sendMessageToUsers = async (
  targetRole: string | null,
  message: string,
): Promise<{ count: number }> => {
  const response = await apiRequest("POST", "/api/admin/message-users", {
    targetRole,
    message,
  });

  if (!response.ok) {
    throw new Error("Failed to send messages to users");
  }

  return response.json();
};
