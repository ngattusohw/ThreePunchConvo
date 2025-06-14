import { useState } from "react";
import { Link } from "wouter";
import { useNotifications } from "@/api/hooks/useNotifications";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/ui/user-avatar";

interface NotificationModalProps {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: NotificationModalProps) {
  const { notifications, isLoading, error, markAllAsRead, isMarking } = useNotifications();

  // Click outside to close
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleModalClick}
    >
      <div className="bg-dark-gray mx-4 w-full max-w-md overflow-hidden rounded-lg shadow-xl">
        <div className="bg-ufc-black flex items-center justify-between border-b border-gray-800 p-4">
          <h3 className="text-lg font-bold text-white">Notifications</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="border-ufc-blue mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
              <p className="mt-2 text-sm text-gray-400">
                Loading notifications...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error loading notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-ufc-black border-t border-gray-800 p-4">
          <button
            onClick={markAllAsRead}
            disabled={isMarking}
            className={`text-sm font-medium text-gray-400 hover:text-white ${isMarking ? "cursor-not-allowed opacity-50" : ""}`}
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
    <li
      className={`flex items-start p-3 ${notification.isRead ? "bg-gray-800 bg-opacity-30" : "bg-gray-800 bg-opacity-50"} rounded-lg`}
    >
      {notification.type === "SYSTEM" ? (
        <div className="bg-ufc-blue mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-black">
          3PC
        </div>
      ) : notification.relatedUser ? (
        <UserAvatar
          user={notification.relatedUser}
          size="md"
          className="mr-3 flex-shrink-0"
        />
      ) : (
        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 font-bold text-white">
          ?
        </div>
      )}

      <div>
        {notification.type === "REPLY" &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className="text-gray-300">
              <span className="font-medium text-white">
                {notification.relatedUser.username}
              </span>{" "}
              replied to your post{" "}
              <Link
                href={`/thread/${notification.threadId}`}
                className="text-ufc-blue hover:underline"
              >
                "{notification.threadTitle}"
              </Link>
            </p>
          )}

        {notification.type === "MENTION" &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className="text-gray-300">
              <span className="font-medium text-white">
                {notification.relatedUser.username}
              </span>{" "}
              mentioned you in a post{" "}
              <Link
                href={`/thread/${notification.threadId}`}
                className="text-ufc-blue hover:underline"
              >
                "{notification.threadTitle}"
              </Link>
            </p>
          )}

        {notification.type === "LIKE" &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className="text-gray-300">
              <span className="font-medium text-white">
                {notification.relatedUser.username}
              </span>{" "}
              liked your post{" "}
              <Link
                href={`/thread/${notification.threadId}`}
                className="text-ufc-blue hover:underline"
              >
                "{notification.threadTitle}"
              </Link>
            </p>
          )}

        {notification.type === "FOLLOW" && notification.relatedUser && (
          <p className="text-gray-300">
            <span className="font-medium text-white">
              {notification.relatedUser.username}
            </span>{" "}
            started following you
          </p>
        )}

        {notification.type === "SYSTEM" && notification.message && (
          <p className="text-gray-300">
            <span className="font-medium text-white">System</span>{" "}
            {notification.message}
          </p>
        )}

        {notification.replyPreview && (
          <p className="mt-1 text-sm text-gray-400">
            {notification.replyPreview}
          </p>
        )}

        <span className="mt-2 block text-xs text-gray-500">
          {formatDate(notification.createdAt)}
        </span>
      </div>
    </li>
  );
}
