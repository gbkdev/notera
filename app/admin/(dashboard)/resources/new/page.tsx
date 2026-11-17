import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCourseOptions } from "@/components/admin/course-options";
import { ResourceForm } from "@/components/admin/resource-form";

export default async function NewResource() {
  const { supabase } = await requireAdmin();
  const courses = await getCourseOptions(supabase);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upload resource</h1>
      {courses.length === 0
        ? <p className="rounded-md bg-muted p-4 text-sm">Add a <Link className="underline" href="/admin/courses">course</Link> before uploading files.</p>
        : <div className="rounded-lg border bg-card p-5"><ResourceForm courses={courses} /></div>}
    </div>
  );
}
