import { requireAdmin } from "@/lib/auth";
import { ImportForm } from "@/components/admin/import-form";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import from JSON</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Add many departments, academic years, semesters and courses at once. Existing entries are skipped, never overwritten.
          Files (PDFs, slides and so on) are still uploaded under Resources.
        </p>
      </div>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-semibold">File format</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed">{`{
  "departments": [
    { "name": "Computer Science", "slug": "computer-science", "description": "…", "icon": "cpu" }
  ],
  "academic_years": [
    { "label": "Year 1", "sort_order": 1,
      "semesters": [ { "name": "Semester 1" }, { "name": "Semester 2" } ] }
  ],
  "courses": [
    { "department": "computer-science", "year": "Year 1", "semester": "Semester 1",
      "code": "CS101", "name": "Introduction to Programming" }
  ]
}`}</pre>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>All three lists are optional, but a course needs its department, year and semester to exist already or appear in the same file.</li>
          <li><code>slug</code>, <code>description</code>, <code>icon</code> and <code>sort_order</code> are optional. Icons: graduation-cap, flask-conical, cpu, stethoscope, scale, landmark, book-open, calculator, building-2, palette, languages, leaf.</li>
          <li>A course can name its department by slug or by name.</li>
        </ul>
      </section>
      <section className="rounded-lg border bg-card p-5"><ImportForm /></section>
    </div>
  );
}
