import { useEffect } from "react";
import { useLocation } from "wouter";
import { useNotifications } from "@/api/hooks/useNotifications";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import { NOTIFICATION_TYPES } from "@/lib/constants";

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const {
    notifications,
    isLoading,
    error,
    markAllAsRead,
    markAsRead,
    isMarking,
  } = useNotifications();
  const [, setLocation] = useLocation();

  // Auto-close dropdown when all notifications are cleared
  useEffect(() => {
    if (notifications.length === 0 && !isLoading) {
      // Small delay to show the "All caught up" message briefly
      const timer = setTimeout(() => {
        onClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [notifications.length, isLoading, onClose]);

  const handleClearAll = async () => {
    await markAllAsRead();
    // Dropdown will auto-close via useEffect when notifications become empty
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark the notification as read
    markAsRead(notification.id);

    // Navigate to the thread with replyId if available
    if (notification.threadId) {
      const url = notification.replyId
        ? `/thread/${notification.threadId}?replyId=${notification.replyId}`
        : `/thread/${notification.threadId}`;

      // Use wouter's setLocation to navigate and close dropdown
      setLocation(url);
      onClose();
    }
  };

  return (
    <div className='bg-dark-gray w-full overflow-hidden rounded-lg shadow-xl'>
      <div className='bg-ufc-black flex items-center justify-between border-b border-gray-800 p-4'>
        <h3 className='text-lg font-bold text-white'>Notifications</h3>
        <button onClick={onClose} className='text-gray-400 hover:text-white'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      <div className='max-h-96 overflow-y-auto p-4'>
        {isLoading ? (
          <div className='py-8 text-center'>
            <div className='border-ufc-blue mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2'></div>
            <p className='mt-2 text-sm text-gray-400'>
              Loading notifications...
            </p>
          </div>
        ) : error ? (
          <div className='py-8 text-center'>
            <p className='text-red-500'>Error loading notifications</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className='py-8 text-center'>
            <p className='text-gray-400'>
              All caught up! No new notifications.
            </p>
          </div>
        ) : (
          <ul className='space-y-4'>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </ul>
        )}
      </div>

      {notifications.length > 0 && (
        <div className='bg-ufc-black border-t border-gray-800 p-4'>
          <button
            onClick={handleClearAll}
            disabled={isMarking}
            className={`text-sm font-medium text-gray-400 hover:text-white ${isMarking ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {isMarking ? "Clearing..." : "Clear all notifications"}
          </button>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { markAsRead } = useNotifications();

  const handleNotificationDismiss = (notification: Notification) => {
    // Mark the notification as read
    markAsRead(notification.id);
  };

  return (
    <li
      className={`flex items-start p-3 ${notification.isRead ? "bg-gray-800 bg-opacity-30" : "bg-gray-800 bg-opacity-50"} cursor-pointer rounded-lg transition-all hover:bg-opacity-70`}
      onClick={onClick}
    >
      {notification.type === NOTIFICATION_TYPES.SYSTEM ? (
        <div className='bg-ufc-blue mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-black'>
          3PC
        </div>
      ) : notification.relatedUser ? (
        <UserAvatar
          user={notification.relatedUser}
          size='md'
          className='mr-3 flex-shrink-0'
        />
      ) : (
        <div className='mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 font-bold text-white'>
          ?
        </div>
      )}

      <div className='flex-1'>
        {notification.type === NOTIFICATION_TYPES.REPLY &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className='text-gray-300'>
              <span className='font-medium text-white'>
                {notification.relatedUser.username}
              </span>{" "}
              replied to your post{" "}
              <span className='text-ufc-blue'>
                "{notification.threadTitle}"
              </span>
            </p>
          )}

        {notification.type === NOTIFICATION_TYPES.MENTION &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className='text-gray-300'>
              <span className='font-medium text-white'>
                {notification.relatedUser.username}
              </span>{" "}
              mentioned you in a post{" "}
              <span className='text-ufc-blue'>
                "{notification.threadTitle}"
              </span>
            </p>
          )}

        {notification.type === NOTIFICATION_TYPES.LIKE &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className='text-gray-300'>
              <span className='font-medium text-white'>
                {notification.relatedUser.username}
              </span>{" "}
              {notification.replyId ? (
                <>
                  liked your reply{" "}
                  <span className='text-ufc-blue'>
                    "{notification.replyPreview}"
                  </span>
                </>
              ) : (
                <>
                  liked your post{" "}
                  <span className='text-ufc-blue'>
                    "{notification.threadTitle}"
                  </span>
                </>
              )}
            </p>
          )}

        {notification.type === NOTIFICATION_TYPES.POTD &&
          notification.relatedUser &&
          notification.threadTitle && (
            <p className='text-gray-300'>
              <span className='font-medium text-white'>
                {notification.relatedUser.username}
              </span>{" "}
              marked your post{" "}
              <span className='text-ufc-blue'>
                "{notification.threadTitle}"
              </span>{" "}
              as their Post of the Day
            </p>
          )}

        {notification.type === NOTIFICATION_TYPES.FOLLOW && notification.relatedUser && (
          <p className='text-gray-300'>
            <span className='font-medium text-white'>
              {notification.relatedUser.username}
            </span>{" "}
            started following you
          </p>
        )}

        {notification.type === NOTIFICATION_TYPES.SYSTEM && notification.message && (
          <p className='text-gray-300'>
            <span className='font-medium text-white'>System</span>{" "}
            {notification.message}
          </p>
        )}

        {notification.type === NOTIFICATION_TYPES.THREAD_PINNED && notification.threadTitle && (
          <p className='text-gray-300'>
            <span className='font-medium text-white'>System</span> Your post{" "}
            <span className='text-ufc-blue'>"{notification.threadTitle}"</span>{" "}
            has been pinned by a moderator
          </p>
        )}

        {(notification.type === NOTIFICATION_TYPES.FIGHTER_POST || notification.type === NOTIFICATION_TYPES.INDUSTRY_PROFESSIONAL_POST) && notification.relatedUser && (
          <p className='text-gray-300'>
            <span className='font-medium text-white'>{notification.relatedUser.username}</span> just posted! Check out their latest thread.
          </p>
        )}

        {notification.replyPreview && !notification.replyId && (
          <p className='mt-1 text-sm text-gray-400'>
            {notification.replyPreview}
          </p>
        )}

        <span className='mt-2 block text-xs text-gray-500'>
          {formatDate(notification.createdAt)}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNotificationDismiss(notification);
        }}
        className='text-gray-400 hover:text-white'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </li>
  );
}
