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
export const markNotificationAsRead = async (notificationId: string): Promise<any> => {
  const response = await apiRequest("POST", `/api/notifications/read/${notificationId}`, {});
  
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

// Helper function to generate mock notifications for demonstration
export const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: "1",
      userId: "1",
      type: "REPLY",
      relatedUserId: "4",
      relatedUser: {
        id: "4",
        username: "MMAHistorian",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 42,
        likesCount: 430,
        pinnedByUserCount: 2,
        rank: 12,
        followersCount: 38,
        followingCount: 126,
        role: "USER",
      },
      threadId: "2",
      threadTitle: "Jones vs Aspinall: Who would win and why?",
      replyId: "123",
      replyPreview: "I disagree. Aspinall's ground game is underrated...",
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: "2",
      userId: "1",
      type: "MENTION",
      relatedUserId: "3",
      relatedUser: {
        id: "3",
        username: "DustinPoirier",
        avatar:
          "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "HALL OF FAMER",
        isOnline: true,
        postsCount: 73,
        likesCount: 4120,
        pinnedByUserCount: 14,
        rank: 1,
        followersCount: 1200,
        followingCount: 23,
        role: "PRO",
      },
      threadId: "3",
      threadTitle: "My thoughts on the upcoming UFC 300 card",
      replyPreview: "@FighterFan84 makes a good point about the...",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "3",
      userId: "1",
      type: "SYSTEM",
      message: "Your status has been updated to CONTENDER",
      isRead: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];
}; 