import { cn } from "@/lib/utils";
import { AuthUser } from "@/lib/types";

interface UserAvatarProps {
  user: AuthUser;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
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

  // For pro users with verified status
  if (user.role === "PRO") {
    return (
      <div className={cn("relative", className)}>
        <img 
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
          alt={`${user.username}'s avatar`} 
          className={cn(sizeClasses[size], "rounded-full object-cover border-2 border-ufc-gold")}
        />
        <div className={cn(verifiedIndicatorSizeClasses[size], "absolute bg-ufc-gold text-ufc-black rounded-full border border-dark-gray flex items-center justify-center")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2/3 w-2/3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <img 
        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
        alt={`${user.username}'s avatar`} 
        className={cn(
          sizeClasses[size], 
          "rounded-full object-cover", 
          user.status === "HALL OF FAMER" || user.status === "CHAMPION" || user.status === "CONTENDER" 
            ? "border-2 border-ufc-gold" 
            : ""
        )}
      />
      
      {user.isOnline && (
        <div className={cn(indicatorSizeClasses[size], "absolute bg-green-500 rounded-full border border-dark-gray")}></div>
      )}
    </div>
  );
}
