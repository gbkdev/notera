import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name, supabase } = await requireAdmin(); // server-side permission check on every admin page
  const open = async (table: string, status: string) =>
    (await supabase.from(table).select("*", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [reports, submissions, requests] = await Promise.all([open("reports", "open"), open("submissions", "pending"), open("requests", "open")]);
  return <AdminShell name={name} counts={{ reports, submissions, requests }}>
    <div className="mb-4 flex justify-end"><LiveRefresh indicator minGap={2000} tables={["resources", "departments", "courses", "submissions", "requests", "reports"]} /></div>
    {children}
  </AdminShell>;
}
