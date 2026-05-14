import React from 'react';

const PackageSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-72 bg-slate-200">
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-300/50">
          <div className="h-5 w-3/4 bg-slate-300 rounded mb-2"></div>
          <div className="flex gap-3">
            <div className="h-3 w-16 bg-slate-300 rounded"></div>
            <div className="h-3 w-24 bg-slate-300 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-3 w-12 bg-slate-100 rounded"></div>
          <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-slate-100 rounded"></div>
          <div className="h-3 w-24 bg-slate-100 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const PackageListSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <PackageSkeleton key={i} />
      ))}
    </div>
  );
};

export default PackageSkeleton;
