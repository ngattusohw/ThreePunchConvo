import {
  AdminUsersResponse,
  AdminUsersFilters,
  AdminFighterInvitationsResponse,
  AdminFighterInvitationsFilters,
} from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { CreateFighterInvitationData, FighterInvitation } from "@/lib/types";

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

export const inviteFighter = async (
  data: CreateFighterInvitationData,
): Promise<{
  message: string;
  invitation: { id: string; email: string; fighterName?: string };
}> => {
  const response = await apiRequest("POST", "/api/admin/invite-fighter", data);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to send fighter invitation");
  }

  return response.json();
};

export const fetchFighterInvitations = async (
  filters: AdminFighterInvitationsFilters,
): Promise<AdminFighterInvitationsResponse> => {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const response = await apiRequest(
    "GET",
    `/api/admin/fighter-invitations?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch fighter invitations for admin view");
  }

  return response.json() as Promise<AdminFighterInvitationsResponse>;
};

export const getAllFighterInvitations = async (): Promise<
  FighterInvitation[]
> => {
  const response = await apiRequest("GET", "/api/admin/fighter-invitations");

  if (!response.ok) {
    throw new Error("Failed to fetch fighter invitations");
  }

  return response.json();
};

export const fetchFighterInvitation = async (
  token: string,
): Promise<{
  email: string;
  fighterName?: string;
}> => {
  const response = await apiRequest("GET", `/api/fighter-invitation/${token}`);

  if (!response.ok) {
    throw new Error("Invalid or expired invitation");
  }

  return response.json();
};

export const generateFighterInviteLink = async (
  data: CreateFighterInvitationData,
): Promise<{
  message: string;
  url: string;
  invitation: {
    id: string;
    email: string;
    fighterName?: string;
    isExisting: boolean;
  };
}> => {
  const response = await apiRequest(
    "POST",
    "/api/admin/generate-fighter-link",
    data,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to generate fighter invitation link",
    );
  }

  return response.json();
};
