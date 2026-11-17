import Link from "next/link";
import { DeptIcon } from "@/components/dept-icon";

export function DepartmentCard({ d }: { d: { slug: string; name: string; description: string; icon: string; course_count: number; resource_count: number } }) {
  return (
    <Link href={`/departments/${d.slug}`} className="group flex flex-col gap-4 rounded-lg border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-accent text-accent-foreground"><DeptIcon name={d.icon} className="h-5 w-5" /></span>
      <div>
        <h3 className="text-lg font-semibold group-hover:text-primary">{d.name}</h3>
        {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
      </div>
      <p className="mt-auto text-sm text-muted-foreground">
        {d.course_count} {d.course_count === 1 ? "course" : "courses"} · {d.resource_count} {d.resource_count === 1 ? "resource" : "resources"}
      </p>
    </Link>
  );
}
