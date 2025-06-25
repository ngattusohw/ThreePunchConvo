import React from "react";
import { Skeleton } from "../ui/skeleton";

export function ForumSkeleton() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col md:flex-row md:space-x-6'>
        {/* Left Sidebar - Categories Skeleton */}
        <div className='mb-6 w-full flex-shrink-0 md:mb-0 md:w-64'>
          <Skeleton className='mb-4 h-10 w-full' />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='mb-2 h-12 w-full' />
          ))}
        </div>

        {/* Center - Forum Content Skeleton */}
        <div className='flex-grow'>
          <Skeleton className='mb-6 h-12 w-full' />

          {/* Thread list skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className='mb-4 rounded-lg border border-gray-800 p-4'>
              <Skeleton className='mb-2 h-6 w-3/4' />
              <Skeleton className='mb-4 h-4 w-1/2' />
              <div className='flex items-center justify-between'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar Skeleton */}
        <aside className='hidden w-80 flex-shrink-0 space-y-6 lg:block'>
          {/* Top Users Skeleton */}
          <div className='bg-dark-gray overflow-hidden rounded-lg p-4'>
            <Skeleton className='mb-4 h-6 w-32' />
            {[...Array(3)].map((_, i) => (
              <div key={i} className='mb-3 flex items-center'>
                <Skeleton className='mr-3 h-10 w-10 rounded-full' />
                <Skeleton className='h-4 w-32' />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
