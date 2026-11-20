"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CATEGORIES } from "@/lib/constants";
import { shareSchema, SUBMISSION_MAX } from "@/lib/contribute";
import { submitContribution } from "@/app/actions/contribute";
import { checkFileBasics } from "@/lib/validation";
import { ACCEPT, SUPPORTED_HINT } from "@/lib/formats";
import { cn, formatBytes } from "@/lib/utils";
import { StudentCoursePicker } from "@/components/student-course-picker";
import { locPayload, type Loc } from "@/lib/loc";
import type { CourseOption } from "@/components/admin/course-options";

export function ShareForm({ departments, courses, initialLoc }: {
  departments: { id: string; name: string }[]; courses: CourseOption[]; initialLoc: Loc;
}) {
  const [loc, setLoc] = useState<Loc>(initialLoc);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("lecture_notes");
  const [contact, setContact] = useState("");
  const [rights, setRights] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setFile(f);
    if (!f) return setFileError(null);
    setFileError(checkFileBasics(f) ?? (f.size > SUBMISSION_MAX ? "Files can be up to 25 MB." : null));
    setTitle((t) => t || f.name.replace(/\.[^.]+$/, "").replace(/_+/g, " ").trim().slice(0, 200));
  }

  if (done)
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-fmt-xls" aria-hidden />
        <h2 className="text-xl font-semibold">Thank you!</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">An administrator will check your file before it appears on Notera. That can take a few days.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => { setDone(false); pick(null); setTitle(""); setDescription(""); setRights(false); }}>Share another file</Button>
          <Link href="/resources" className={buttonVariants()}>Browse resources</Link>
        </div>
      </div>
    );

  return (
    <form noValidate className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" onSubmit={(e) => {
      e.preventDefault();
      const payload = { ...locPayload(loc), title, description, category, contact, rights, website };
      const parsed = shareSchema.safeParse(payload);
      const map: Record<string, string> = {};
      if (!parsed.success) parsed.error.issues.forEach((i) => { map[String(i.path[0])] ||= i.message; });
      if (!file) map.file = "Choose a file to upload.";
      else if (fileError) map.file = fileError;
      setErrors(map);
      if (Object.keys(map).length) return void toast.error(Object.values(map)[0]);

      const body = new FormData();
      Object.entries(payload).forEach(([k, v]) => body.set(k, String(v)));
      body.set("file", file!);
      start(async () => {
        const res = await submitContribution(body);
        if (!res.ok) return void toast.error(res.error);
        toast.success("File sent for review");
        setDone(true);
      });
    }}>
      <StudentCoursePicker departments={departments} courses={courses} loc={loc} onChange={setLoc} error={errors.course_text} />

      <Field label="File" error={errors.file} hint={`${SUPPORTED_HINT}, up to ${formatBytes(SUBMISSION_MAX)}.`}>
        <span
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
          className={cn("flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-background p-6 hover:border-primary", dragging ? "border-primary bg-muted" : "border-input")}>
          <UploadCloud className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-medium">{file ? `${file.name} (${formatBytes(file.size)})` : "Drag a file here, or tap to choose one"}</span>
          </span>
          <input ref={input} type="file" className="sr-only" accept={ACCEPT} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </span>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" error={errors.title}><Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Type of file">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Short description (optional)" error={errors.description}>
        <Textarea value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className="min-h-20" />
      </Field>
      <Field label="Contact (optional)" error={errors.contact} hint="Only administrators see this, in case they have a question about your file.">
        <Input value={contact} maxLength={120} placeholder="Telegram @name or email" onChange={(e) => setContact(e.target.value)} />
      </Field>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
          <span>I made this file, or I’m allowed to share it. It isn’t a scanned or pirated textbook.</span>
        </label>
        {errors.rights && <p role="alert" className="mt-1 text-xs text-destructive">{errors.rights}</p>}
      </div>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Send for review"}</Button>
    </form>
  );
}
