import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { SemesterForm, YearForm } from "@/components/admin/simple-forms";
import { DeleteButton } from "@/components/admin/bits";
import { buttonVariants } from "@/components/ui/button";
import { deleteSemester, deleteYear } from "@/app/actions/admin";
import type { AcademicYear, Semester } from "@/lib/types";

export default async function AdminTerms(props: { searchParams: Promise<{ year?: string; semester?: string }> }) {
  const searchParams = await props.searchParams;
  const { supabase } = await requireAdmin();
  const [y, s] = await Promise.all([
    supabase.from("academic_years").select("*").order("sort_order").order("label"),
    supabase.from("semesters").select("*").order("sort_order").order("name"),
  ]);
  const years = (y.data ?? []) as AcademicYear[];
  const semesters = (s.data ?? []) as Semester[];
  const editYear = years.find((v) => v.id === searchParams.year);
  const editSem = semesters.find((v) => v.id === searchParams.semester);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Years & semesters</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-semibold">{editYear ? `Edit ${editYear.label}` : "Add an academic year"}</h2>
          <YearForm key={editYear?.id ?? "new"} id={editYear?.id} initial={editYear ? { label: editYear.label, sort_order: editYear.sort_order } : undefined} />
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-semibold">{editSem ? `Edit ${editSem.name}` : "Add a semester"}</h2>
          <SemesterForm key={editSem?.id ?? "new"} years={years} id={editSem?.id}
            initial={editSem ? { academic_year_id: editSem.academic_year_id, name: editSem.name, sort_order: editSem.sort_order } : undefined} />
        </section>
      </div>
      {years.length === 0 && <p className="text-sm text-muted-foreground">No academic years yet. Add one above.</p>}
      <div className="space-y-4">
        {years.map((yr) => (
          <section key={yr.id} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">{yr.label}</h2>
              <div className="flex items-center gap-1">
                <Link href={`/admin/terms?year=${yr.id}`} aria-label={`Edit ${yr.label}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil className="h-4 w-4" /></Link>
                <DeleteButton label={yr.label} action={deleteYear.bind(null, yr.id)} />
              </div>
            </div>
            <ul className="divide-y">
              {semesters.filter((m) => m.academic_year_id === yr.id).map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  {m.name}
                  <span className="flex items-center gap-1">
                    <Link href={`/admin/terms?semester=${m.id}`} aria-label={`Edit ${m.name}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil className="h-4 w-4" /></Link>
                    <DeleteButton label={m.name} action={deleteSemester.bind(null, m.id)} />
                  </span>
                </li>
              ))}
              {semesters.every((m) => m.academic_year_id !== yr.id) && <li className="px-4 py-3 text-sm text-muted-foreground">No semesters yet.</li>}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
