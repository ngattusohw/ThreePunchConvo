import React from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import FCBadge from "@/components/ui/fc-badge";
import { AuthUser } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";

interface UserThreadHeaderProps {
  user: Partial<AuthUser>;
  createdAt: string | Date;
  isPinned?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pinnedPosition?: 'right' | 'inline';
}

export default function UserThreadHeader({
  user,
  createdAt,
  isPinned = false,
  showStatus = true,
  size = 'md',
  pinnedPosition = 'inline'
}: UserThreadHeaderProps) {
  const isNormalUser = user?.role !== USER_ROLES.FIGHTER && user?.role !== USER_ROLES.INDUSTRY_PROFESSIONAL && user?.role !== USER_ROLES.ADMIN && user?.role !== USER_ROLES.MODERATOR;
  
  // Get status color class
  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case "HALL OF FAMER":
        return "text-amber-300"; // Gold for hall of famers
      case "CHAMPION":
        return "text-purple-400"; // Purple for champions
      case "CONTENDER":
        return "text-red-400"; // Red for contenders
      case "RANKED POSTER":
        return "text-orange-400"; // Orange for ranked posters
      case "COMPETITOR":
        return "text-green-400"; // Green for competitors
      case "REGIONAL POSTER":
        return "text-blue-400"; // Blue for regional posters
      case "AMATEUR":
        return "text-cyan-400"; // Cyan for amateurs
      default:
        return "text-gray-400"; // Gray as fallback
    }
  };
  
  const statusColorClass = user?.status ? getStatusColorClass(user.status) : "text-gray-400";
  
  return (
    <div className="flex items-center flex-wrap gap-2 relative">
      {/* Pinned badge - for right position (absolute) */}
      {pinnedPosition === 'right' && isPinned && (
        <span className="absolute top-0 right-0 bg-gray-800 text-ufc-blue text-xs px-2 py-0.5 rounded font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
          </svg>
          <span className="hidden md:inline">PINNED</span>
        </span>
      )}
      
      {/* Pinned badge - for inline position */}
      {pinnedPosition === 'inline' && isPinned && (
        <span className="bg-gray-800 text-ufc-blue text-xs px-2 py-0.5 rounded font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
          </svg>
          PINNED
        </span>
      )}
      
      {/* User Avatar */}
      <div className="mr-3 flex-shrink-0 flex flex-col items-center">
        <UserAvatar user={user as AuthUser} size={size} />
      </div>
      
      <div className="flex flex-col space-y-1">
        {/* Top line: Status and FC Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* User badges */}
          {showStatus && isNormalUser && 
              <StatusBadge status={user?.status || ""} />
          }
          
          {user?.role === "FIGHTER" && (
            <span className="flex items-center rounded-full bg-ufc-gold px-2 py-0.5 text-xs font-bold text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              PRO FIGHTER
            </span>
          )}

          {user?.role === "INDUSTRY_PROFESSIONAL" && (
            <span className="flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              MMA INDUSTRY
            </span>
          )}

          {user?.role === "ADMIN" && (
            <span className="bg-ufc-gold text-ufc-black rounded px-2 py-0.5 text-xs font-bold">
              ADMIN
            </span>
          )}

          {user?.role === "MODERATOR" && (
            <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
              MOD
            </span>
          )}
          
          {/* FC Badge */}
          {user?.rank !== undefined && isNormalUser && (
            <FCBadge rank={user.rank} size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
          )}
        </div>
        
        {/* Bottom line: Username and Date */}
        <div className="flex items-center gap-2">
          {/* Username */}
          <Link
            href={`/user/${user?.username}`}
            className="hover:text-ufc-blue font-medium text-white transition"
          >
            {user?.username}
          </Link>
          
          {/* Date */}
          <span className="text-sm text-gray-400">
          · {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
} 