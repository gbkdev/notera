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
import { createResource, updateResource } from "@/app/actions/admin";
import { formatBytes } from "@/lib/utils";

export function ResourceForm({ courses, initial, id, currentFile }: {
  courses: { id: string; label: string }[];
  initial?: ResourceValues; id?: string; currentFile?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const empty: ResourceValues = { course_id: "", title: "", description: "", category: "lecture_notes", featured: false };
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResourceValues>({ resolver: zodResolver(resourceSchema), defaultValues: initial ?? empty });

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
        else { reset(empty); pick(null); if (inputRef.current) inputRef.current.value = ""; router.push("/admin/resources"); }
        router.refresh();
      });
    })}>
      <div className="sm:col-span-2"><Field label="Title" error={errors.title?.message}><Input {...register("title")} /></Field></div>
      <Field label="Course" error={errors.course_id?.message}>
        <Select {...register("course_id")}><option value="">Choose a course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select>
      </Field>
      <Field label="Category" error={errors.category?.message}>
        <Select {...register("category")}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
      </Field>
      <div className="sm:col-span-2"><Field label="Short description" error={errors.description?.message}><Textarea {...register("description")} /></Field></div>

      <div className="sm:col-span-2">
        <Field label={id ? "Replace file (optional)" : "File"} error={fileError ?? undefined}
          hint={`PDF, PowerPoint, Word or Excel, up to ${formatBytes(MAX_FILE_SIZE)}.${currentFile ? ` Current file: ${currentFile}` : ""}`}>
          <span className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-card p-4 hover:border-primary">
            <UploadCloud className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm">{file ? `${file.name} (${formatBytes(file.size)})` : "Choose a file"}</span>
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
