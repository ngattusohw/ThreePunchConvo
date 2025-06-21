import { useState } from "react";
import { Link, useLocation } from "wouter";
import { dark } from "@clerk/themes";
import MobileNavigation from "@/components/layout/MobileNavigation";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";
import { SignInButton, useClerk } from "@clerk/clerk-react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { UserMenu } from "@/components/ui/user-menu";
import { toast } from "@/hooks/use-toast";
import { deleteAccount } from "@/api/queries/user";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, isSignedIn, isLoaded } = useMemoizedUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {

      await deleteAccount(user?.id);

      toast({
        title: "Account deleted",
        description: "Your account has been deleted",
      });

      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error deleting account",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <header className="bg-ufc-black sticky top-0 z-50 border-b border-gray-800">
      <div className="w-full px-6 py-2 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white md:hidden"
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

          <div className="hidden items-center space-x-6 md:flex">
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
              <UserMenu handleDeleteAccount={handleDeleteAccount} />
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
                <button className="bg-ufc-blue hover:bg-ufc-blue-dark rounded-lg px-4 py-2 text-sm text-black">
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
    </header>
  );
}
