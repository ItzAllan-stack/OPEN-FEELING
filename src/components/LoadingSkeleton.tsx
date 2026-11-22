import React from 'react';

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading stories">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EEE8E1]" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-36 bg-[#EEE8E1] rounded" />
              <div className="h-3 w-24 bg-[#F8F6F3] rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-[#EEE8E1] rounded" />
            <div className="h-3.5 w-full bg-[#F8F6F3] rounded" />
            <div className="h-3.5 w-5/6 bg-[#F8F6F3] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
