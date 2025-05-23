import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import NotificationModal from "@/components/notification/NotificationModal";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { formatUsername } from "@/lib/utils";
import { UserStatus } from "@/lib/types";
import StatusBadge from "@/components/ui/status-badge";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";

export default function Header() {
  const [location] = useLocation();
  const { currentUser: user, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of the user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only close if the menu is open
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        // Use setTimeout to ensure the click event doesn't immediately close the menu
        // This allows clicks on menu items to register before the menu closes
        setTimeout(() => {
          setUserMenuOpen(false);
        }, 50);
      }
    }

    // Add the event listener
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]); // Re-run effect when menu open state changes

  return (
    <header className="bg-ufc-black border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white p-2"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="4PUNCH CONVO" className="h-8" />
            </Link>
          </div>

          <div className="hidden md:flex space-x-6 items-center">
            <nav className="flex space-x-6">
              <Link
                href="/forum"
                className={`font-heading font-medium ${location === "/forum" ? "text-white" : "text-gray-400 hover:text-white"} transition`}
              >
                FORUM
              </Link>
              {/* <Link
                href="/schedule"
                className={`font-heading font-medium ${location === "/schedule" ? "text-white" : "text-gray-400 hover:text-white"} transition`}
              >
                SCHEDULES
              </Link> */}
              <Link
                href="/rankings"
                className={`font-heading font-medium ${location === "/rankings" ? "text-white" : "text-gray-400 hover:text-white"} transition`}
              >
                RANKINGS
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* TODO notifications
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="text-gray-400 hover:text-white relative"
                >
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-ufc-blue text-black text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </button> */}

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("User menu clicked");
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className={`flex items-center space-x-2 px-2 py-1 rounded transition-colors cursor-pointer ${userMenuOpen ? "bg-gray-800" : "hover:bg-gray-800"}`}
                  >
                    <div className="relative">
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${user.username}&background=random`
                        }
                        alt={`${user.username}'s avatar`}
                        className="h-8 w-8 rounded-full object-cover border-2 border-ufc-gold"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 ${user.isOnline ? "bg-green-500" : "bg-gray-500"} rounded-full h-3 w-3 border border-ufc-black`}
                      ></div>
                    </div>
                    <span className="text-white font-medium hidden md:block">
                      {formatUsername(user.username)}
                    </span>
                    {user.status && (
                      <span
                        className="hidden md:block"
                      >
                        <StatusBadge status={user.status} />
                      </span>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-400 hidden md:block transform transition-transform ${userMenuOpen ? "rotate-180" : "rotate-0"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-ufc-black border border-gray-700 rounded-md shadow-lg py-1 z-50"
                      onClick={(e) => {
                        // Prevent click event from bubbling up and triggering the outside click handler
                        console.log("TEST!!!!!!!!");
                        e.stopPropagation();
                      }}
                    >
                      <Link
                        href={`/user/${user.username}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                        onClick={(e) => {
                          // Don't close the menu immediately on click
                          e.stopPropagation();
                          // Close after navigation completes
                          setTimeout(() => setUserMenuOpen(false), 100);
                        }}
                      >
                        Profile
                      </Link>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUserMenuOpen(false);
                          try {
                            await logout();
                          } catch (error) {
                            console.error('Logout failed:', error);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <div className="flex space-x-2">
                <button
                  onClick={() => login()}
                  className="text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <MobileNavigation onClose={() => setMobileMenuOpen(false)} />
      )}
      {notificationsOpen && (
        <NotificationModal onClose={() => setNotificationsOpen(false)} />
      )}
    </header>
  );
}
