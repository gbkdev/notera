import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDepartments } from "@/lib/queries";
import { DepartmentForm } from "@/components/admin/simple-forms";
import { DeleteButton } from "@/components/admin/bits";
import { buttonVariants, LinkButton } from "@/components/ui/button";
import { deleteDepartment } from "@/app/actions/admin";

export default async function AdminDepartments({ searchParams }: { searchParams: { edit?: string } }) {
  await requireAdmin();
  const departments = await getDepartments();
  const editing = departments.find((d) => d.id === searchParams.edit);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">Departments</h1><LinkButton href="/admin/import" variant="outline">Add many from JSON</LinkButton></div>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold">{editing ? `Edit ${editing.name}` : "Add a department"}</h2>
        <DepartmentForm key={editing?.id ?? "new"} id={editing?.id}
          initial={editing ? { name: editing.name, slug: editing.slug, description: editing.description, icon: editing.icon } : undefined} />
      </section>
      <ul className="divide-y rounded-lg border bg-card">
        {departments.length === 0 && <li className="p-6 text-sm text-muted-foreground">No departments yet. Add the first one above.</li>}
        {departments.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0"><p className="font-medium">{d.name}</p><p className="text-sm text-muted-foreground">{d.course_count} courses · {d.resource_count} resources</p></div>
            <div className="flex items-center gap-1">
              <Link href={`/admin/departments?edit=${d.id}`} aria-label={`Edit ${d.name}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil className="h-4 w-4" /></Link>
              <DeleteButton label={d.name} action={deleteDepartment.bind(null, d.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
