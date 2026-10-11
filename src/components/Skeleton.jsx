import { cn } from "@/lib/utils";

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function DiscoveryCardSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading job recommendations, please wait.</span>
      <div aria-hidden="true" className="max-w-md mx-auto bg-card rounded-3xl border border-border shadow-lg overflow-hidden">
        <div className="p-5 pb-3 flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="px-5 pb-3 space-y-2">
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="px-5 pb-3 flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="px-5 pb-5 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Loading jobs, please wait.</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApplicationsListSkeleton({ count = 4 }) {
  return (
    <div className="py-6 space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading your applications, please wait.</span>
      <div aria-hidden="true" className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="w-5 h-5 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSectionSkeleton() {
  return (
    <div className="py-6 space-y-5" role="status" aria-live="polite">
      <span className="sr-only">Loading your profile, please wait.</span>
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3" aria-hidden="true">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="py-6 space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard, please wait.</span>
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3" aria-hidden="true">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-3" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}