import React from 'react';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-[#EAE4D7]/70 ${className}`} aria-hidden="true" />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
    <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] flex items-center justify-between gap-4">
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-6 w-56" />
        <SkeletonBlock className="h-3 w-72" />
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-32 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-[#EAE4D7] space-y-2.5">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#EAE4D7] space-y-4">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-60 w-full rounded-lg" />
      </div>
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] space-y-4">
        <SkeletonBlock className="h-4 w-36" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
            <SkeletonBlock className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ReportsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-[#EAE4D7] space-y-2">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-7 w-24" />
          <SkeletonBlock className="h-3 w-36" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] space-y-3">
        <SkeletonBlock className="h-4 w-44" />
        <SkeletonBlock className="h-64 w-full rounded-lg" />
      </div>
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] space-y-3">
        <SkeletonBlock className="h-4 w-44" />
        <SkeletonBlock className="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
);
