import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  generateMockNotifications,
} from "../queries/notification";
import { Notification } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications query
  const notificationsQuery = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: fetchNotifications,
  });

  // Get notifications with fallback to mock data if empty
  const allNotifications = notificationsQuery.data?.length
    ? notificationsQuery.data
    : [];

  // Filter out read notifications for the UI
  const notifications = allNotifications.filter((n) => !n.isRead);

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notifications cleared",
        description: "All notifications have been marked as read and cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read.",
        variant: "destructive",
      });
    },
  });

  return {
    notifications,
    allNotifications, // Keep this for the notification bell count
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAsRead: (notificationId: string) =>
      markAsReadMutation.mutate(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarking: markAllAsReadMutation.isPending,
    isMarkingSingle: markAsReadMutation.isPending,
  };
}
