import {  AdminViewUser } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export const fetchUsers = async ():Promise<AdminViewUser[]> => {
  const response = await apiRequest("GET", "/api/users");

  if (!response.ok) {
    throw new Error("Failed to fetch users for admin view");
  }

  return response.json() as Promise<AdminViewUser[]>;
};

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  const response = await apiRequest("PUT", `/api/users/${userId}/role`, {
    role,
  });

  if (!response.ok) {
    throw new Error("Failed to update user role");
  }
};