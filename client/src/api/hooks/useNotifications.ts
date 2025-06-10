import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsAsRead, generateMockNotifications } from "../queries/notification";
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
  const notifications = notificationsQuery.data?.length
    ? notificationsQuery.data
    : generateMockNotifications();

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notifications updated",
        description: "All notifications marked as read.",
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
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarking: markAllAsReadMutation.isPending,
  };
} 