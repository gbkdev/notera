import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatBytes, formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/bits";
import { getCourseOptions } from "@/components/admin/course-options";
import { SubmissionReview } from "@/components/admin/review-bits";
import { FormatBadge } from "@/components/resource-card";
import { buttonVariants } from "@/components/ui/button";
import { deleteSubmission } from "@/app/actions/review";
import { hasServiceKey } from "@/lib/supabase/service";

type Row = {
  id: string; course_id: string | null; department_text: string; course_text: string; title: string; description: string;
  category: string; file_path: string; file_name: string; file_ext: string; file_size: number; contact: string;
  status: "pending" | "approved" | "rejected"; resource_id: string | null; created_at: string;
  courses: { code: string; name: string } | null;
};

export default async function AdminSubmissions(props: { searchParams: Promise<{ show?: string }> }) {
  const searchParams = await props.searchParams;
  const { supabase } = await requireAdmin();
  const showAll = searchParams.show === "all";
  let q = supabase.from("submissions")
    .select("id, course_id, department_text, course_text, title, description, category, file_path, file_name, file_ext, file_size, contact, status, resource_id, created_at, courses(code, name)")
    .order("created_at", { ascending: false }).limit(50);
  if (!showAll) q = q.eq("status", "pending");
  const { data, error } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const courses = await getCourseOptions(supabase);

  // Private files: short-lived links that only this signed-in admin session can create.
  const links = new Map<string, string>();
  await Promise.all(rows.filter((r) => r.status === "pending").map(async (r) => {
    const { data: signed } = await supabase.storage.from("submissions").createSignedUrl(r.file_path, 600, { download: r.file_name });
    if (signed?.signedUrl) links.set(r.id, signed.signedUrl);
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Student submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Files sent in by students. Nothing is public until you approve it. Open each file and check it first.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/submissions" className={buttonVariants({ variant: showAll ? "outline" : "default", size: "sm" })}>Pending</Link>
          <Link href="/admin/submissions?show=all" className={buttonVariants({ variant: showAll ? "default" : "outline", size: "sm" })}>All</Link>
        </div>
      </div>
      {!hasServiceKey() && (
        <p role="alert" className="rounded-md border border-destructive/50 bg-card p-4 text-sm">
          Student uploads are switched <strong>off</strong> because <code>SUPABASE_SERVICE_ROLE_KEY</code> isn’t set. Add it to <code>.env.local</code> (and to Vercel’s environment variables), then restart or redeploy.
        </p>
      )}
      {error && <p role="alert" className="rounded-md bg-muted p-4 text-sm">Submissions aren’t set up yet. Run <code>0006_contributions.sql</code> in the Supabase SQL Editor.</p>}
      {!error && rows.length === 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground"><Inbox className="h-4 w-4" aria-hidden /> {showAll ? "No submissions yet." : "Nothing waiting for review."}</p>
      )}
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium"><FormatBadge ext={r.file_ext} /><span className="truncate">{r.title}</span></p>
                <p className="text-sm text-muted-foreground">
                  {r.file_name} · {formatBytes(r.file_size)} · {formatDate(r.created_at)}
                  {r.status !== "pending" && ` · ${r.status === "approved" ? "Approved" : "Rejected"}`}
                </p>
                <p className="mt-1 text-sm">
                  {r.courses ? <>Course: <strong>{r.courses.code} {r.courses.name}</strong></>
                    : <>Student’s course (not in the catalogue): <strong>{r.department_text} / {r.course_text}</strong></>}
                </p>
                {r.contact && <p className="text-sm text-muted-foreground">Contact: <span className="font-medium text-foreground">{r.contact}</span></p>}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {links.get(r.id) && <a href={links.get(r.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>Open file</a>}
                {r.resource_id && <Link href={`/admin/resources/${r.resource_id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View resource</Link>}
                {r.status !== "pending" && <DeleteButton label="submission" action={deleteSubmission.bind(null, r.id)} />}
              </div>
            </div>
            {r.status === "pending" && (
              <SubmissionReview id={r.id} courses={courses}
                initial={{ course_id: r.course_id ?? "", title: r.title, description: r.description, category: r.category }} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
