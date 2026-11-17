import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/queries";
import { getCourseOptions } from "@/components/admin/course-options";
import { ResourceForm } from "@/components/admin/resource-form";
import { LinkButton } from "@/components/ui/button";

export default async function EditResource({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  const [r, courses] = await Promise.all([getResource(params.id), getCourseOptions(supabase)]);
  if (!r) notFound();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Edit resource</h1>
        <LinkButton href={`/resources/${r.id}`} variant="outline" target="_blank" rel="noopener noreferrer">View public page</LinkButton>
      </div>
      <div className="rounded-lg border bg-card p-5">
        <ResourceForm id={r.id} courses={courses} currentFile={r.file_name}
          initial={{ course_id: r.course_id, title: r.title, description: r.description, category: r.category as never, featured: r.featured }} />
      </div>
    </div>
  );
}
