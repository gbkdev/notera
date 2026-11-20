import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { DeleteButton, ReportStatusButton } from "@/components/admin/bits";
import { buttonVariants } from "@/components/ui/button";
import { deleteReport } from "@/app/actions/admin";

type Row = {
  id: string; reason: string; message: string; status: "open" | "resolved"; created_at: string;
  resource_id: string; resources: { title: string } | null;
};

export default async function AdminReports(props: { searchParams: Promise<{ show?: string }> }) {
  const searchParams = await props.searchParams;
  const { supabase } = await requireAdmin();
  const showAll = searchParams.show === "all";
  let q = supabase.from("reports").select("id, reason, message, status, created_at, resource_id, resources(title)")
    .order("created_at", { ascending: false }).limit(100);
  if (!showAll) q = q.eq("status", "open");
  const { data, error } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const label = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <Link href="/admin/reports" className={buttonVariants({ variant: showAll ? "outline" : "default", size: "sm" })}>Open</Link>
          <Link href="/admin/reports?show=all" className={buttonVariants({ variant: showAll ? "default" : "outline", size: "sm" })}>All</Link>
        </div>
      </div>
      {error && <p role="alert" className="rounded-md bg-muted p-4 text-sm">Reports aren’t set up yet. Run <code>0005_reports.sql</code> in the Supabase SQL Editor.</p>}
      {!error && rows.length === 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" aria-hidden /> {showAll ? "No reports yet." : "No open reports. Nice."}</p>
      )}
      <ul className="divide-y rounded-lg border bg-card empty:hidden">
        {rows.map((r) => (
          <li key={r.id} className="space-y-2 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{r.resources?.title ?? "Deleted resource"}</p>
                <p className="text-sm text-muted-foreground">{label(r.reason)} · {formatDate(r.created_at)}{r.status === "resolved" && " · Resolved"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {r.resources && <Link href={`/admin/resources/${r.resource_id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Edit file</Link>}
                <ReportStatusButton id={r.id} status={r.status} />
                <DeleteButton label="report" action={deleteReport.bind(null, r.id)} />
              </div>
            </div>
            {r.message && <p className="rounded-md bg-muted p-3 text-sm">{r.message}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
