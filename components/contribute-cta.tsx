import { LinkButton } from "@/components/ui/button";

/** "Can't find it?" prompt with optional pre-filled context (course, department or search text). */
export function ContributeCta({ courseId, deptId, q, compact = false }: { courseId?: string; deptId?: string; q?: string; compact?: boolean }) {
  const ctx = [courseId && `course=${courseId}`, !courseId && deptId && `dept=${deptId}`, q && `q=${encodeURIComponent(q.slice(0, 100))}`].filter(Boolean).join("&");
  const href = (tab: string) => `/contribute?tab=${tab}${ctx ? `&${ctx}` : ""}`;
  return (
    <div className={compact ? "flex flex-wrap items-center gap-3 text-sm" : "flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5"}>
      <p className={compact ? "text-muted-foreground" : "font-medium"}>Missing something? Ask for it, or share a file you have.</p>
      <div className="flex gap-2">
        <LinkButton href={href("request")} size="sm" variant={compact ? "outline" : "default"}>Request a file</LinkButton>
        <LinkButton href={href("share")} size="sm" variant="outline">Share a file</LinkButton>
      </div>
    </div>
  );
}
