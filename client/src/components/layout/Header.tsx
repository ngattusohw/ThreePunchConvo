import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { dark } from '@clerk/themes';
import NotificationModal from "@/components/notification/NotificationModal";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { formatUsername } from "@/lib/utils";
import { UserStatus } from "@/lib/types";
import StatusBadge from "@/components/ui/status-badge";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";
import { SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react';

export default function Header() {
  const [location] = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Placeholder function for when we need to fetch additional user data from our database
  const getUserStatus = (userId: string) => {
    // Here you would fetch the user's status from your database
    // This is just a placeholder implementation
    return "AMATEUR" as UserStatus;
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  console.log("isSignedIn", isSignedIn);
  console.log("user", user);

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
              <img src={logoImage} alt="3 PUNCH CONVO" className="h-8" />
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
            {isSignedIn && user ? (
              <>
                {/* TODO notifications */}
                
                <div className="relative flex items-center space-x-2">
                  {user.username && (
                    <Link href={`/user/${user.username}`} className="text-white font-medium hidden md:block">
                      {formatUsername(user.username)}
                    </Link>
                  )}
                  
                  {user.id && (
                    <span className="hidden md:block">
                      <StatusBadge status={getUserStatus(user.id)} />
                    </span>
                  )}
                  
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <SignInButton 
                appearance={{
                  baseTheme: dark,
                  elements: {
                    formButtonPrimary: "bg-ufc-blue hover:bg-ufc-blue-dark",
                    footerActionLink: "text-ufc-blue hover:text-ufc-blue-dark",
                    // Other element customizations
                  },
                  variables: {
                    colorPrimary: "#25C3EC",
                    // Other color variables
                  },
                }} 
                mode="modal" 
              >
                <button className="px-4 py-2 bg-ufc-blue hover:bg-ufc-blue-dark text-black rounded-lg text-sm">
                  Sign In
                </button>
              </SignInButton>
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
