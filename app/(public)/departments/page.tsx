import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { getDepartments } from "@/lib/queries";
import { DepartmentCard } from "@/components/department-card";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await getDepartments();
  return (
    <div className="py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">Departments</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Pick your department to see its courses by academic year and semester.</p>
      <div className="mt-10">
        {departments.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No departments yet">An administrator needs to add departments before they appear here.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{departments.map((d) => <DepartmentCard key={d.id} d={d} />)}</div>
        )}
      </div>
    </div>
  );
}
