import type { Metadata } from "next";
import Link from "next/link";
import { hasServiceKey } from "@/lib/supabase/service";
import { getCourseOptionsPublic, getDepartmentOptions } from "@/lib/public-queries";
import { RequestForm } from "@/components/request-form";
import { ShareForm } from "@/components/share-form";
import { emptyLoc, type Loc } from "@/lib/loc";
import { UUID_RE, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Request or share a file" };
export const dynamic = "force-dynamic";

export default async function ContributePage(props: { searchParams: Promise<{ tab?: string; course?: string; dept?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab === "share" ? "share" : "request";
  const [departments, courses] = await Promise.all([getDepartmentOptions(), getCourseOptionsPublic()]);

  // Pre-fill from the page the student came from.
  let loc: Loc = emptyLoc;
  const course = UUID_RE.test(searchParams.course ?? "") ? courses.find((c) => c.id === searchParams.course) : undefined;
  if (course) loc = { ...emptyLoc, deptSel: course.department_id, courseSel: course.id };
  else if (UUID_RE.test(searchParams.dept ?? "") && departments.some((d) => d.id === searchParams.dept)) loc = { ...emptyLoc, deptSel: searchParams.dept! };

  const ctx = [course && `course=${course.id}`, !course && loc.deptSel && `dept=${loc.deptSel}`].filter(Boolean).join("&");
  const tabHref = (t: string) => `/contribute?tab=${t}${ctx ? `&${ctx}` : ""}`;
  const pill = (active: boolean) => cn("rounded-full border px-5 py-2 text-sm font-medium", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary");

  return (
    <div className="mx-auto max-w-2xl py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">Request or share a file</h1>
      <p className="mt-3 text-muted-foreground">
        Can’t find something for your course? Ask for it. Have a file other students could use? Send it in. Nothing needs an account.
      </p>

      <div role="group" aria-label="Choose what to do" className="mt-8 flex flex-wrap gap-2">
        <Link href={tabHref("request")} aria-current={tab === "request" ? "true" : undefined} className={pill(tab === "request")}>I can’t find a file</Link>
        <Link href={tabHref("share")} aria-current={tab === "share" ? "true" : undefined} className={pill(tab === "share")}>I have a file to share</Link>
      </div>

      <div className="mt-6">
        {tab === "request" ? (
          <RequestForm departments={departments} courses={courses} initialLoc={loc} initialTitle={(searchParams.q ?? "").slice(0, 200)} />
        ) : hasServiceKey() ? (
          <ShareForm departments={departments} courses={courses} initialLoc={loc} />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">File sharing isn’t switched on yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">You can still <Link className="text-primary underline" href={tabHref("request")}>request a file</Link>.</p>
            {process.env.NODE_ENV !== "production" && (
              <p className="mx-auto mt-4 max-w-md rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
                <strong className="text-foreground">Site owner:</strong> add <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code> to <code>.env.local</code> (Supabase → Settings → API) and restart <code>npm run dev</code>. Do the same in your Vercel environment variables for the live site.
              </p>
            )}
          </div>
        )}
      </div>
      {tab === "share" && (
        <p className="mt-4 text-xs text-muted-foreground">
          Files are reviewed by an administrator before anyone else can see them. Your contact details, if you add them, are visible to administrators only.
        </p>
      )}
    </div>
  );
}
