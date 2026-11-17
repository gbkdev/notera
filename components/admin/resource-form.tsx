"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CATEGORIES, MAX_FILE_SIZE } from "@/lib/constants";
import { checkFileBasics, resourceSchema, type ResourceValues } from "@/lib/validation";
import { createResource, updateResource } from "@/app/actions/admin";
import { cn, formatBytes } from "@/lib/utils";
import type { CourseOption } from "@/components/admin/course-options";

export function ResourceForm({ courses, initial, id, currentFile }: {
  courses: CourseOption[];
  initial?: ResourceValues; id?: string; currentFile?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const empty: ResourceValues = { course_id: "", title: "", description: "", category: "lecture_notes", featured: false };
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ResourceValues>({ resolver: zodResolver(resourceSchema), defaultValues: initial ?? empty });

  // Department → year → semester → course. Each step only offers what exists under the previous choice.
  const start0 = courses.find((c) => c.id === initial?.course_id);
  const [dept, setDept] = useState(start0?.department_id ?? "");
  const [year, setYear] = useState(start0?.year_id ?? "");
  const [sem, setSem] = useState(start0?.semester_id ?? "");
  const [courseId, setCourseId] = useState(initial?.course_id ?? "");
  const [dragging, setDragging] = useState(false);
  const uniq = <T extends { id: string }>(xs: T[]) => Array.from(new Map(xs.map((x) => [x.id, x])).values());
  const depts = useMemo(() => uniq(courses.map((c) => ({ id: c.department_id, label: c.department_name }))), [courses]);
  const years = useMemo(() => uniq(courses.filter((c) => c.department_id === dept).map((c) => ({ id: c.year_id, label: c.year_label }))), [courses, dept]);
  const sems = useMemo(() => uniq(courses.filter((c) => c.department_id === dept && c.year_id === year).map((c) => ({ id: c.semester_id, label: c.semester_name }))), [courses, dept, year]);
  const opts = useMemo(() => courses.filter((c) => c.department_id === dept && c.year_id === year && c.semester_id === sem), [courses, dept, year, sem]);
  function chooseCourse(v: string) { setCourseId(v); setValue("course_id", v, { shouldValidate: true }); }

  function pick(f: File | null) {
    setFile(f);
    setFileError(f ? checkFileBasics(f) : null);
  }

  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => {
      if (!id && !file) return void setFileError("Choose a file to upload.");
      if (file && checkFileBasics(file)) return;
      const body = new FormData();
      body.set("course_id", v.course_id); body.set("title", v.title); body.set("description", v.description);
      body.set("category", v.category); body.set("featured", String(v.featured));
      if (file) body.set("file", file);
      start(async () => {
        const res = id ? await updateResource(id, body) : await createResource(body);
        if (!res.ok) return void toast.error(res.error);
        toast.success(id ? "Resource updated" : "Resource uploaded");
        if (id) router.push("/admin/resources");
        else { reset(empty); setDept(""); setYear(""); setSem(""); setCourseId(""); pick(null); if (inputRef.current) inputRef.current.value = ""; router.push("/admin/resources"); }
        router.refresh();
      });
    })}>
      <div className="sm:col-span-2"><Field label="Title" error={errors.title?.message}><Input {...register("title")} /></Field></div>
      <Field label="Department">
        <Select value={dept} onChange={(e) => { setDept(e.target.value); setYear(""); setSem(""); chooseCourse(""); }}>
          <option value="">Choose a department</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Academic year">
        <Select value={year} disabled={!dept} onChange={(e) => { setYear(e.target.value); setSem(""); chooseCourse(""); }}>
          <option value="">Choose a year</option>{years.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Semester">
        <Select value={sem} disabled={!year} onChange={(e) => { setSem(e.target.value); chooseCourse(""); }}>
          <option value="">Choose a semester</option>{sems.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Course" error={errors.course_id?.message}>
        <Select value={courseId} disabled={!sem} onChange={(e) => chooseCourse(e.target.value)}>
          <option value="">Choose a course</option>{opts.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
        </Select>
        <input type="hidden" {...register("course_id")} />
      </Field>
      <Field label="Category" error={errors.category?.message}>
        <Select {...register("category")}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
      </Field>
      <div className="sm:col-span-2"><Field label="Short description" error={errors.description?.message}><Textarea {...register("description")} /></Field></div>

      <div className="sm:col-span-2">
        <Field label={id ? "Replace file (optional)" : "File"} error={fileError ?? undefined}
          hint={`PDF, PowerPoint, Word or Excel, up to ${formatBytes(MAX_FILE_SIZE)}.${currentFile ? ` Current file: ${currentFile}` : ""}`}>
          <span
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
            className={cn("flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-card p-6 hover:border-primary", dragging ? "border-primary bg-muted" : "border-input")}>
            <UploadCloud className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium">{file ? `${file.name} (${formatBytes(file.size)})` : "Drag a file here, or click to choose one"}</span>
              {!file && <span className="text-muted-foreground">PDF, PowerPoint, Word or Excel</span>}
            </span>
            <input ref={inputRef} type="file" className="sr-only"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </span>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" {...register("featured")} /> Feature this resource on the homepage
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? (id ? "Saving…" : "Uploading…") : id ? "Save changes" : "Upload resource"}</Button>
        <Link href="/admin/resources" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
      </div>
    </form>
  );
}
