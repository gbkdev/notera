import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCourseOptions } from "@/components/admin/course-options";
import { BulkUpload } from "@/components/admin/bulk-upload";

export default async function BulkUploadPage() {
  const { supabase } = await requireAdmin();
  const courses = await getCourseOptions(supabase);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk upload</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick a course and category once, add as many files as you like, tidy the titles (they start as the file names), then upload.
        </p>
      </div>
      {courses.length === 0
        ? <p className="rounded-md bg-muted p-4 text-sm">Add a <Link className="underline" href="/admin/courses">course</Link> before uploading files.</p>
        : <div className="rounded-lg border bg-card p-5"><BulkUpload courses={courses} /></div>}
    </div>
  );
}
