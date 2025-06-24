import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/api/hooks/useNotifications";
import NotificationDropdown from "@/components/notification/NotificationDropdown";

export default function NotificationBell() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { allNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count unread notifications
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className='relative p-2 text-gray-400 transition-colors hover:text-white'
        aria-label='Notifications'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='1.5'
          stroke='currentColor'
          className='size-6'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0'
          />
        </svg>

        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white'>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className='bg-dark-gray absolute right-0 top-full z-50 mt-2 w-80 md:w-96 rounded-lg border border-gray-800 shadow-xl transform translate-x-12 md:translate-x-0'>
          <NotificationDropdown onClose={handleCloseDropdown} />
        </div>
      )}
    </div>
  );
}
