"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CATEGORIES, MAX_FILE_SIZE } from "@/lib/constants";
import { checkFileBasics, resourceSchema, type ResourceValues } from "@/lib/validation";
import { ACCEPT, SUPPORTED_HINT } from "@/lib/formats";
import { createResource, setFeatured, updateResource } from "@/app/actions/admin";
import { cn, formatBytes } from "@/lib/utils";
import type { CourseOption } from "@/components/admin/course-options";
import { CoursePicker } from "@/components/admin/course-picker";

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

  const [featuredPending, startFeatured] = useTransition();
  const [courseId, setCourseId] = useState(initial?.course_id ?? "");
  const [dragging, setDragging] = useState(false);
  const featuredReg = register("featured");
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
        else { reset(empty); setCourseId(""); pick(null); if (inputRef.current) inputRef.current.value = ""; router.push("/admin/resources"); }
        router.refresh();
      });
    })}>
      <div className="sm:col-span-2"><Field label="Title" error={errors.title?.message}><Input {...register("title")} /></Field></div>
      <CoursePicker key={id ?? "new"} courses={courses} value={courseId} onChange={chooseCourse} error={errors.course_id?.message} />
      <input type="hidden" {...register("course_id")} />
      <Field label="Category" error={errors.category?.message}>
        <Select {...register("category")}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
      </Field>
      <div className="sm:col-span-2"><Field label="Short description" error={errors.description?.message}><Textarea {...register("description")} /></Field></div>

      <div className="sm:col-span-2">
        <Field label={id ? "Replace file (optional)" : "File"} error={fileError ?? undefined}
          hint={`${SUPPORTED_HINT}, up to ${formatBytes(MAX_FILE_SIZE)}.${currentFile ? ` Current file: ${currentFile}` : ""}`}>
          <span
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
            className={cn("flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-card p-6 hover:border-primary", dragging ? "border-primary bg-muted" : "border-input")}>
            <UploadCloud className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium">{file ? `${file.name} (${formatBytes(file.size)})` : "Drag a file here, or click to choose one"}</span>
              {!file && <span className="text-muted-foreground">PDF, Word, PowerPoint, Excel, images, text, ZIP and more</span>}
            </span>
            <input ref={inputRef} type="file" className="sr-only"
              accept={ACCEPT} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </span>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" disabled={featuredPending} className="h-4 w-4 accent-[hsl(var(--primary))]" {...featuredReg}
          onChange={(e) => {
            featuredReg.onChange(e);
            if (!id) return; // new resources are featured when the form is saved
            const next = e.target.checked;
            startFeatured(async () => {
              const res = await setFeatured(id, next);
              if (res.ok) { toast.success(next ? "Added to the homepage" : "Removed from the homepage"); router.refresh(); }
              else { toast.error(res.error); setValue("featured", !next); }
            });
          }} />
        Feature this resource on the homepage{id && <span className="text-muted-foreground">(applies instantly)</span>}
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? (id ? "Saving…" : "Uploading…") : id ? "Save changes" : "Upload resource"}</Button>
        <Link href="/admin/resources" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
      </div>
    </form>
  );
}
