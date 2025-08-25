import React from "react";
import { Skeleton } from "../ui/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className='mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl relative'>
      {/* Header */}
      <div className='mb-6'>
        <Skeleton className='h-8 w-48 mb-2' />
      </div>

      {/* Plan Selection Skeleton */}
      <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
        <Skeleton className='h-5 w-32 mb-4' />
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-lg border border-gray-600 p-3'>
            <div className='text-center space-y-2'>
              <Skeleton className='h-4 w-16 mx-auto' />
              <Skeleton className='h-3 w-20 mx-auto' />
            </div>
          </div>
          <div className='rounded-lg border border-gray-600 p-3 relative'>
            <div className='text-center space-y-2'>
              <Skeleton className='h-4 w-16 mx-auto' />
              <Skeleton className='h-3 w-20 mx-auto' />
            </div>
            <div className='absolute -top-2 -right-2'>
              <Skeleton className='h-6 w-16 rounded-full' />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details Skeleton */}
      <div className='mb-8 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-md'>
        <div className='mb-4 flex items-center justify-between'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-6 w-16 rounded-full' />
        </div>

        {/* Savings banner skeleton */}
        <div className='mb-4'>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>

        {/* Features skeleton */}
        <div className='mb-5 space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-start'>
              <div className='mr-3 mt-1'>
                <Skeleton className='h-5 w-5 rounded-full' />
              </div>
              <Skeleton className='h-4 w-48' />
            </div>
          ))}
        </div>

        <div className='flex items-center justify-between border-t border-gray-700 pt-4'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-6 w-20' />
        </div>
      </div>

      {/* Promo Code Skeleton */}
      <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
        <Skeleton className='h-5 w-24 mb-4' />
        <div className='flex gap-3'>
          <Skeleton className='flex-1 h-12 rounded-lg' />
          <Skeleton className='h-12 w-16 rounded-lg' />
        </div>
      </div>

      {/* User Email Skeleton */}
      <div className='mb-6 flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
        <Skeleton className='mr-3 h-5 w-5' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* Payment Element Skeleton */}
      <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
        <Skeleton className='h-5 w-32 mb-4' />
        <div className='space-y-4'>
          <Skeleton className='h-12 w-full rounded-lg' />
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-12 w-full rounded-lg' />
            <Skeleton className='h-12 w-full rounded-lg' />
          </div>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>
      </div>

      {/* Submit Button Skeleton */}
      <Skeleton className='h-12 w-full rounded-lg mb-4' />

      {/* Terms Text Skeleton */}
      <Skeleton className='h-3 w-56 mx-auto' />
      
    </div>
  );
} 