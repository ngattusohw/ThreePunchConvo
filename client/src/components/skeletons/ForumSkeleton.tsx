import React from "react";
import { Skeleton } from "../ui/Skeleton";

export function ForumSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Sidebar - Categories Skeleton */}
        <div className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0">
          <Skeleton className="h-10 w-full mb-4" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>

        {/* Center - Forum Content Skeleton */}
        <div className="flex-grow">
          <Skeleton className="h-12 w-full mb-6" />
          
          {/* Thread list skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4 p-4 border border-gray-800 rounded-lg">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar Skeleton */}
        <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
          {/* Top Users Skeleton */}
          <div className="bg-dark-gray rounded-lg overflow-hidden p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center mb-3">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          
          {/* Discord Community Ad Skeleton */}
          <div className="bg-dark-gray rounded-lg overflow-hidden p-4">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </aside>
      </div>
    </div>
  );
} 