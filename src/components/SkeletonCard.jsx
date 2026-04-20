import React from 'react';

/**
 * SkeletonCard Component
 * -----------------------
 * Visual placeholder for ingredient cards during data transmission.
 * Optimized with theme-aware pulse animations and identical layout dimensions.
 */
export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between h-[280px] animate-pulse transition-colors">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="h-6 bg-gray-100 dark:bg-zinc-800 rounded-lg w-1/2"></div>
          <div className="h-5 bg-gray-100 dark:bg-zinc-800 rounded-lg w-16 ml-3"></div>
        </div>
        <div className="space-y-5 mt-6">
          <div className="flex justify-between border-b border-gray-50 dark:border-zinc-800 pb-3">
            <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-md w-1/3"></div>
            <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-md w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-md w-1/4"></div>
            <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded-md w-1/3"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-8 border-t border-gray-50 dark:border-zinc-800">
        <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
      </div>
    </div>
  );
}
