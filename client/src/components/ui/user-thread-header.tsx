import React from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import FCBadge from "@/components/ui/fc-badge";
import { AuthUser } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";
import UserRoleBadge from "./UserBadge";

interface UserThreadHeaderProps {
  user: Partial<AuthUser>;
  createdAt: string | Date;
  isPinned?: boolean;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  pinnedPosition?: "right" | "inline";
}

export default function UserThreadHeader({
  user,
  createdAt,
  isPinned = false,
  showStatus = true,
  size = "md",
  pinnedPosition = "inline",
}: UserThreadHeaderProps) {
  const isNormalUser =
    user?.role !== USER_ROLES.FIGHTER &&
    user?.role !== USER_ROLES.INDUSTRY_PROFESSIONAL &&
    user?.role !== USER_ROLES.ADMIN &&
    user?.role !== USER_ROLES.MODERATOR;

  return (
    <div className='relative flex flex-wrap items-center gap-2'>
      {/* Pinned badge - for right position (absolute) */}
      {pinnedPosition === "right" && isPinned && (
        <span className='text-ufc-blue absolute right-0 top-0 flex items-center rounded bg-gray-800 px-2 py-0.5 text-xs font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-1 h-4 w-4'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z' />
          </svg>
          <span className='hidden md:inline'>PINNED</span>
        </span>
      )}

      {/* Pinned badge - for inline position */}
      {pinnedPosition === "inline" && isPinned && (
        <span className='text-ufc-blue flex items-center rounded bg-gray-800 px-2 py-0.5 text-xs font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-1 h-4 w-4'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z' />
          </svg>
          PINNED
        </span>
      )}

      {/* User Avatar */}
      <div className='mr-3 flex flex-shrink-0 flex-col items-center'>
        <UserAvatar user={user as AuthUser} size={size} />
      </div>

      <div className='flex flex-col space-y-1'>
        {/* Top line: Status and FC Badge */}
        <div className='flex flex-wrap items-center gap-2'>
          {/* User badges */}
          {showStatus && isNormalUser && (
            <StatusBadge status={user?.status || ""} />
          )}
          <UserRoleBadge role={user?.role || ""} />
          {/* FC Badge */}
          {user?.rank !== undefined && isNormalUser && (
            <FCBadge
              rank={user.rank}
            />
          )}
        </div>

        {/* Bottom line: Username and Date */}
        <div className='flex items-center gap-2'>
          {/* Username */}
          <Link
            href={`/user/${user?.username}`}
            className='hover:text-ufc-blue font-medium text-white transition'
          >
            {user?.username}
          </Link>

          {/* Date */}
          <span className='text-sm text-gray-400'>
            · {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
