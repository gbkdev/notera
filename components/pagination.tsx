import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Pagination({ basePath, params, page, pageCount }: {
  basePath: string; params: Record<string, string | undefined>; page: number; pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v && k !== "page") sp.set(k, v); });
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
      {page > 1
        ? <Link href={href(page - 1)} className={buttonVariants({ variant: "outline" })}><ChevronLeft className="h-4 w-4" />Previous</Link>
        : <span />}
      <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
      {page < pageCount
        ? <Link href={href(page + 1)} className={buttonVariants({ variant: "outline" })}>Next<ChevronRight className="h-4 w-4" /></Link>
        : <span />}
    </nav>
  );
}
