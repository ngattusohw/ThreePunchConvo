import React from "react";

interface FCBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export default function FCBadge({ rank, size = "md" }: FCBadgeProps) {
  // Size class mapping
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1.5",
  };
  
  const baseClasses = "bg-gradient-to-br from-orange-500 to-orange-400 text-white font-bold rounded-xl inline-flex items-center shadow-lg shadow-orange-500/30";
  
  return (
    <div className={`${baseClasses} ${sizeClasses[size]}`}>
      FC: {rank}
    </div>
  );
} 