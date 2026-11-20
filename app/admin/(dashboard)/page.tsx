import Link from "next/link";
import { BookMarked, Building2, Download, FileStack, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getMostDownloaded, getRecentResources } from "@/lib/queries";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const count = async (table: string, featured = false) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (featured) q = q.eq("featured", true);
    return (await q).count ?? 0;
  };
  const [resources, departments, courses, featured, recent, top, totalRes] = await Promise.all([
    count("resources"), count("departments"), count("courses"), count("resources", true), getRecentResources(5), getMostDownloaded(5),
    supabase.rpc("total_downloads"),
  ]);
  const downloads = Number(totalRes.data ?? 0);
  const waiting = async (table: string, status: string) =>
    (await supabase.from(table).select("*", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [openReports, pendingSubs, openRequests] = await Promise.all([waiting("reports", "open"), waiting("submissions", "pending"), waiting("requests", "open")]);
  const todo = [
    { n: pendingSubs, label: pendingSubs === 1 ? "student file to review" : "student files to review", href: "/admin/submissions" },
    { n: openRequests, label: openRequests === 1 ? "file request" : "file requests", href: "/admin/requests" },
    { n: openReports, label: openReports === 1 ? "problem report" : "problem reports", href: "/admin/reports" },
  ].filter((t) => t.n > 0);
  const stats = [
    { label: "Resources", value: resources, icon: FileStack, href: "/admin/resources" },
    { label: "Departments", value: departments, icon: Building2, href: "/admin/departments" },
    { label: "Courses", value: courses, icon: BookMarked, href: "/admin/courses" },
    { label: "Featured", value: featured, icon: Star, href: "/admin/resources" },
    { label: "Downloads", value: downloads, icon: Download, href: "/admin/resources?sort=popular" },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Overview</h1>
        <LinkButton href="/admin/resources/new">Upload resource</LinkButton>
      </div>
      {todo.length > 0 && (
        <div className="rounded-lg border border-accent bg-card p-4">
          <p className="mb-2 font-semibold">Needs your attention</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {todo.map((t) => (
              <li key={t.href}><Link href={t.href} className="text-primary hover:underline"><strong>{t.n}</strong> {t.label}</Link></li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border bg-card p-5 hover:border-primary">
            <s.icon className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="font-display text-4xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Latest uploads</h2>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p> : (
          <ul className="divide-y rounded-lg border bg-card">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/admin/resources/${r.id}`} className="min-w-0 truncate font-medium hover:text-primary">{r.title}</Link>
                <span className="shrink-0 text-muted-foreground">{r.course_code} · {formatDate(r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {top.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Most downloaded</h2>
          <ul className="divide-y rounded-lg border bg-card">
            {top.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/admin/resources/${r.id}`} className="min-w-0 truncate font-medium hover:text-primary">{r.title}</Link>
                <span className="shrink-0 text-muted-foreground">{r.course_code} · {r.download_count} {r.download_count === 1 ? "download" : "downloads"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
