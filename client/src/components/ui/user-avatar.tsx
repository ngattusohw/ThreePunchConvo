import { cn } from "@/lib/utils";
import { AuthUser } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";

interface UserAvatarProps {
  user?: AuthUser | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({
  user,
  size = "md",
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const indicatorSizeClasses = {
    sm: "h-2.5 w-2.5 -bottom-0.5 -right-0.5",
    md: "h-3 w-3 -bottom-1 -right-1",
    lg: "h-3.5 w-3.5 -bottom-1 -right-1",
    xl: "h-4 w-4 -bottom-1 -right-1",
  };

  const verifiedIndicatorSizeClasses = {
    sm: "h-3 w-3 -bottom-0.5 -right-0.5",
    md: "h-4 w-4 -bottom-1 -right-1",
    lg: "h-5 w-5 -bottom-1 -right-1",
    xl: "h-6 w-6 -bottom-1 -right-1",
  };

  // Check if user is defined
  if (!user) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            sizeClasses[size],
            "flex items-center justify-center rounded-full bg-gray-600 text-gray-400",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-1/2 w-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>
    );
  }

  // For pro users with verified status
  if (user?.role === USER_ROLES.FIGHTER) {
    return (
      <div className={cn("relative", className)}>
        <img
          src={
            user?.profileImageUrl ||
            `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`
          }
          alt={`${user?.username || "User"}'s avatar`}
          className={cn(
            sizeClasses[size],
            "border-ufc-gold rounded-full border-2 object-cover",
          )}
        />
        <div
          className={cn(
            verifiedIndicatorSizeClasses[size],
            "bg-ufc-gold text-ufc-black border-dark-gray absolute flex items-center justify-center rounded-full border",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-2/3 w-2/3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  } else if (user?.role === USER_ROLES.INDUSTRY_PROFESSIONAL) {
    console.log("Industry Professional:", user);
      return (
        <div className={cn("relative", className)}>
          <img
            src={
              user?.profileImageUrl ||
              `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`
            }
            alt={`${user?.username || "User"}'s avatar`}
            className={cn(
              sizeClasses[size],
              "border-red-500 rounded-full border-2 object-cover",
            )}
          />
          <div
            className={cn(
              verifiedIndicatorSizeClasses[size],
              "bg-red-500 text-ufc-black absolute flex items-center justify-center rounded-full",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2/3 w-2/3"
              viewBox="0 0 20 20"
              fill="white"
              >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      );
    }

  return (
    <div className={cn("relative", className)}>
      <img
        src={
          user?.profileImageUrl ||
          `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`
        }
        alt={`${user?.username || "User"}'s avatar`}
        className={cn(
          sizeClasses[size],
          "rounded-full object-cover",
          user?.status === "HALL OF FAMER" ||
            user?.status === "CHAMPION" ||
            user?.status === "CONTENDER"
            ? "border-ufc-gold border-2"
            : "",
        )}
      />

      {user?.isOnline && (
        <div
          className={cn(
            indicatorSizeClasses[size],
            "border-dark-gray absolute rounded-full border bg-green-500",
          )}
        ></div>
      )}
    </div>
  );
}
