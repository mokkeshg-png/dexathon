import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#EBE5D8]/70 ${className}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="clay-card-cream p-6 sm:p-8 rounded-3xl border border-[#ECE5D8]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-2xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-32 rounded-2xl" />
            <Skeleton className="h-11 w-36 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clay-card-white p-5 rounded-2xl border border-[#ECE5D8] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 rounded-xl" />
            <Skeleton className="h-2 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content 2-Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-44 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="clay-card-cream p-5 rounded-2xl border border-[#ECE5D8] space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-36 rounded-xl" />
          <div className="clay-card-white p-5 rounded-2xl border border-[#ECE5D8] space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FacultyDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse min-h-[60vh] max-w-7xl mx-auto px-4 py-8">
      {/* Faculty Header Skeleton */}
      <div className="clay-card-cream p-6 rounded-3xl border border-[#ECE5D8] flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-7 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clay-card-white p-4 rounded-2xl border border-[#ECE5D8] space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="clay-card-cream p-5 rounded-2xl border border-[#ECE5D8] space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse min-h-[60vh] max-w-7xl mx-auto px-4 py-8">
      <div className="clay-card-cream p-6 rounded-3xl border border-[#ECE5D8] flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-60 rounded" />
        </div>
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clay-card-white p-5 rounded-2xl border border-[#ECE5D8] space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-14 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="clay-card-white p-6 rounded-3xl border border-[#ECE5D8] space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#ECE5D8]/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
