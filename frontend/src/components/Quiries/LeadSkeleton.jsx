import React from 'react';

const LeadSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
      </div>

      {/* Details Skeleton */}
      <div className="space-y-3 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-slate-100 rounded"></div>
          <div className="h-3 w-40 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-slate-100 rounded"></div>
          <div className="h-3 w-24 bg-slate-100 rounded"></div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
          <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
};

export const LeadsListSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <LeadSkeleton key={i} />
      ))}
    </div>
  );
};

export default LeadSkeleton;
