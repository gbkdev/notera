import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/bits";
import { RequestStatusButtons } from "@/components/admin/review-bits";
import { buttonVariants } from "@/components/ui/button";
import { deleteRequest } from "@/app/actions/review";

type Row = {
  id: string; title: string; details: string; category: string | null; contact: string; status: "open" | "fulfilled" | "dismissed";
  created_at: string; department_text: string; course_text: string; course_id: string | null;
  departments: { name: string } | null; courses: { code: string; name: string } | null;
};

export default async function AdminRequests(props: { searchParams: Promise<{ show?: string }> }) {
  const searchParams = await props.searchParams;
  const { supabase } = await requireAdmin();
  const showAll = searchParams.show === "all";
  let q = supabase.from("requests")
    .select("id, title, details, category, contact, status, created_at, department_text, course_text, course_id, departments(name), courses(code, name)")
    .order("created_at", { ascending: false }).limit(100);
  if (!showAll) q = q.eq("status", "open");
  const { data, error } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Files students couldn’t find. Upload them, then mark the request fulfilled.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/requests" className={buttonVariants({ variant: showAll ? "outline" : "default", size: "sm" })}>Open</Link>
          <Link href="/admin/requests?show=all" className={buttonVariants({ variant: showAll ? "default" : "outline", size: "sm" })}>All</Link>
        </div>
      </div>
      {error && <p role="alert" className="rounded-md bg-muted p-4 text-sm">Requests aren’t set up yet. Run <code>0006_contributions.sql</code> in the Supabase SQL Editor.</p>}
      {!error && rows.length === 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground"><Inbox className="h-4 w-4" aria-hidden /> {showAll ? "No requests yet." : "No open requests."}</p>
      )}
      <ul className="divide-y rounded-lg border bg-card empty:hidden">
        {rows.map((r) => {
          const dept = r.departments?.name ?? r.department_text;
          const course = r.courses ? `${r.courses.code} ${r.courses.name}` : r.course_text;
          const cat = CATEGORIES.find((c) => c.value === r.category)?.label;
          return (
            <li key={r.id} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {[dept, course, cat].filter(Boolean).join(" · ")} · {formatDate(r.created_at)}
                    {r.status !== "open" && ` · ${r.status === "fulfilled" ? "Fulfilled" : "Dismissed"}`}
                    {!r.courses && r.course_text && " · course not in catalogue"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <RequestStatusButtons id={r.id} status={r.status} />
                  <DeleteButton label="request" action={deleteRequest.bind(null, r.id)} />
                </div>
              </div>
              {r.details && <p className="rounded-md bg-muted p-3 text-sm">{r.details}</p>}
              {r.contact && <p className="text-sm text-muted-foreground">Contact: <span className="font-medium text-foreground">{r.contact}</span></p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
