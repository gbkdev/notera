import Link from "next/link";
import { BookMarked, Building2, FileStack, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRecentResources } from "@/lib/queries";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const count = async (table: string, featured = false) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (featured) q = q.eq("featured", true);
    return (await q).count ?? 0;
  };
  const [resources, departments, courses, featured, recent] = await Promise.all([
    count("resources"), count("departments"), count("courses"), count("resources", true), getRecentResources(5),
  ]);
  const stats = [
    { label: "Resources", value: resources, icon: FileStack, href: "/admin/resources" },
    { label: "Departments", value: departments, icon: Building2, href: "/admin/departments" },
    { label: "Courses", value: courses, icon: BookMarked, href: "/admin/courses" },
    { label: "Featured", value: featured, icon: Star, href: "/admin/resources" },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Overview</h1>
        <LinkButton href="/admin/resources/new">Upload resource</LinkButton>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
    </div>
  );
}
