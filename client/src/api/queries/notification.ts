import { Notification } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

/**
 * Fetch user notifications
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await apiRequest("GET", "/api/notifications");

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<any> => {
  const response = await apiRequest(
    "POST",
    `/api/notifications/read/${notificationId}`,
    {},
  );

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }

  return response.json();
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<any> => {
  const response = await apiRequest("POST", "/api/notifications/read-all", {});

  if (!response.ok) {
    throw new Error("Failed to mark notifications as read");
  }

  return response.json();
};
