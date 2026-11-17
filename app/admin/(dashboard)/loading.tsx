import { Skeleton } from "@/components/ui/misc";
export default function Loading() {
  return <div className="space-y-4" aria-busy="true"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
}
