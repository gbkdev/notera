import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-6 py-16" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-14 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
      </div>
    </div>
  );
}
