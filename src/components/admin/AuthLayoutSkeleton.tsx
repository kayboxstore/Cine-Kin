import { Skeleton } from "@/components/ui/skeleton";

export function AuthLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2 px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 px-1">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-32" />
          </div>
        </div>
      </div>

      {/* Main skeleton */}
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
