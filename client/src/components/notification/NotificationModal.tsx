import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/ui/user-avatar";

interface NotificationModalProps {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: NotificationModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    // In a real app, we would fetch from the API
  });

  // For demo purposes, create mock notifications if none are returned from the API
  const displayNotifications = notifications?.length 
    ? notifications 
    : generateMockNotifications();

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications/read-all", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notifications updated",
        description: "All notifications marked as read.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read.",
        variant: "destructive"
      });
    }
  });

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Click outside to close
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleModalClick}>
      <div className="bg-dark-gray rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-xl">
        <div className="bg-ufc-black p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="text-white font-bold text-lg">Notifications</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
              <p className="mt-2 text-gray-400 text-sm">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error loading notifications</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {displayNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-ufc-black p-4 border-t border-gray-800">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className={`text-gray-400 hover:text-white text-sm font-medium ${markAllAsReadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
}

function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <li className={`flex items-start p-3 ${notification.isRead ? 'bg-gray-800 bg-opacity-30' : 'bg-gray-800 bg-opacity-50'} rounded-lg`}>
      {notification.type === "SYSTEM" ? (
        <div className="h-10 w-10 rounded-full bg-ufc-red flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
          3PC
        </div>
      ) : notification.relatedUser ? (
        <UserAvatar user={notification.relatedUser} size="md" className="mr-3 flex-shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
          ?
        </div>
      )}

      <div>
        {notification.type === "REPLY" && notification.relatedUser && notification.threadTitle && (
          <p className="text-gray-300">
            <span className="font-medium text-white">{notification.relatedUser.username}</span> replied to your post <Link href={`/thread/${notification.threadId}`} className="text-ufc-red hover:underline">"{notification.threadTitle}"</Link>
          </p>
        )}
        
        {notification.type === "MENTION" && notification.relatedUser && notification.threadTitle && (
          <p className="text-gray-300">
            <span className="font-medium text-white">{notification.relatedUser.username}</span> mentioned you in a post <Link href={`/thread/${notification.threadId}`} className="text-ufc-red hover:underline">"{notification.threadTitle}"</Link>
          </p>
        )}
        
        {notification.type === "LIKE" && notification.relatedUser && notification.threadTitle && (
          <p className="text-gray-300">
            <span className="font-medium text-white">{notification.relatedUser.username}</span> liked your post <Link href={`/thread/${notification.threadId}`} className="text-ufc-red hover:underline">"{notification.threadTitle}"</Link>
          </p>
        )}
        
        {notification.type === "FOLLOW" && notification.relatedUser && (
          <p className="text-gray-300">
            <span className="font-medium text-white">{notification.relatedUser.username}</span> started following you
          </p>
        )}
        
        {notification.type === "SYSTEM" && notification.message && (
          <p className="text-gray-300">
            <span className="font-medium text-white">System</span> {notification.message}
          </p>
        )}
        
        {notification.replyPreview && (
          <p className="text-gray-400 text-sm mt-1">{notification.replyPreview}</p>
        )}
        
        <span className="text-gray-500 text-xs mt-2 block">{formatDate(notification.createdAt)}</span>
      </div>
    </li>
  );
}

// Helper function to generate mock notifications for demonstration
function generateMockNotifications(): Notification[] {
  return [
    {
      id: 1,
      userId: 1,
      type: "REPLY",
      relatedUserId: 4,
      relatedUser: {
        id: 4,
        username: "MMAHistorian",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "RANKED POSTER",
        isOnline: true,
        postsCount: 42,
        likesCount: 430,
        potdCount: 2,
        rank: 12,
        followersCount: 38,
        followingCount: 126,
        role: "USER",
      },
      threadId: 2,
      threadTitle: "Jones vs Aspinall: Who would win and why?",
      replyId: 123,
      replyPreview: "I disagree. Aspinall's ground game is underrated...",
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: 2,
      userId: 1,
      type: "MENTION",
      relatedUserId: 3,
      relatedUser: {
        id: 3,
        username: "DustinPoirier",
        avatar: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "HALL OF FAMER",
        isOnline: true,
        postsCount: 73,
        likesCount: 4120,
        potdCount: 14,
        rank: 1,
        followersCount: 1200,
        followingCount: 23,
        role: "PRO",
      },
      threadId: 3,
      threadTitle: "My thoughts on the upcoming UFC 300 card",
      replyPreview: "@FighterFan84 makes a good point about the...",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 3,
      userId: 1,
      type: "SYSTEM",
      message: "Your status has been updated to CONTENDER",
      isRead: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    }
  ];
}
