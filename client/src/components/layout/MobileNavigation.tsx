import { Link, useLocation } from "wouter";

interface MobileNavigationProps {
  onClose: () => void;
}

export default function MobileNavigation({ onClose }: MobileNavigationProps) {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden bg-dark-gray border-b border-gray-800">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex flex-col space-y-3">
          <Link 
            href="/forum" 
            onClick={onClose}
            className={`${location === "/forum" ? "text-white" : "text-gray-400"} font-heading font-medium py-2 border-b border-gray-800`}
          >
            FORUM
          </Link>
          <Link 
            href="/schedule" 
            onClick={onClose}
            className={`${location === "/schedule" ? "text-white" : "text-gray-400"} font-heading font-medium py-2 border-b border-gray-800`}
          >
            SCHEDULE
          </Link>
          <Link 
            href="/rankings" 
            onClick={onClose}
            className={`${location === "/rankings" ? "text-white" : "text-gray-400"} font-heading font-medium py-2`}
          >
            RANKINGS
          </Link>
        </div>
      </nav>
    </div>
  );
}
