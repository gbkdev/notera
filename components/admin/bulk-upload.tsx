"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { CATEGORIES, MAX_FILE_SIZE } from "@/lib/constants";
import { checkFileBasics } from "@/lib/validation";
import { ACCEPT, SUPPORTED_HINT } from "@/lib/formats";
import { createResource } from "@/app/actions/admin";
import { cn, formatBytes } from "@/lib/utils";
import { CoursePicker } from "@/components/admin/course-picker";
import type { CourseOption } from "@/components/admin/course-options";

type Item = { id: string; file: File; title: string; status: "ready" | "uploading" | "done" | "error"; error?: string };

/** "Lecture_01_Intro.pdf" → "Lecture 01 Intro" */
const titleFromName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);

export function BulkUpload({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [category, setCategory] = useState<string>("lecture_notes");
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [needCourse, setNeedCourse] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function add(files: FileList | File[]) {
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      if (items.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
      const problem = checkFileBasics(file);
      next.push({ id: crypto.randomUUID(), file, title: titleFromName(file.name), status: problem ? "error" : "ready", error: problem ?? undefined });
    }
    setItems((cur) => [...cur, ...next]);
  }
  const patch = (id: string, p: Partial<Item>) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const uploadable = items.filter((i) => i.status === "ready" || (i.status === "error" && !checkFileBasics(i.file)));

  async function run() {
    if (!courseId) { setNeedCourse(true); return void toast.error("Choose the course these files belong to."); }
    setNeedCourse(false);
    setRunning(true);
    let ok = 0, failed = 0;
    // One file per request keeps each upload small and lets a single failure leave the rest untouched.
    for (const item of uploadable) {
      if (item.title.trim().length < 2) { patch(item.id, { status: "error", error: "Title is too short." }); failed++; continue; }
      patch(item.id, { status: "uploading", error: undefined });
      const body = new FormData();
      body.set("course_id", courseId); body.set("title", item.title.trim()); body.set("description", "");
      body.set("category", category); body.set("featured", "false"); body.set("file", item.file);
      try {
        const res = await createResource(body);
        if (res.ok) { patch(item.id, { status: "done" }); ok++; }
        else { patch(item.id, { status: "error", error: res.error }); failed++; }
      } catch {
        patch(item.id, { status: "error", error: "The upload was interrupted. Try again." }); failed++;
      }
    }
    setRunning(false);
    router.refresh();
    if (ok) toast.success(`${ok} ${ok === 1 ? "file" : "files"} uploaded`);
    if (failed) toast.error(`${failed} ${failed === 1 ? "file" : "files"} need attention`);
  }

  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CoursePicker courses={courses} value={courseId} onChange={(v) => { setCourseId(v); if (v) setNeedCourse(false); }} error={needCourse ? "Choose a course" : undefined} />
        <Field label="Category for all files">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-card p-10 text-center hover:border-primary", dragging ? "border-primary bg-muted" : "border-input")}>
        <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden />
        <span className="font-medium">Drag files here, or click to choose several</span>
        <span className="text-sm text-muted-foreground">{SUPPORTED_HINT} · up to {formatBytes(MAX_FILE_SIZE)} each</span>
        <input ref={input} type="file" multiple className="sr-only" accept={ACCEPT}
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </label>

      {items.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border bg-card">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-5 shrink-0" aria-hidden>
                  {i.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {i.status === "done" && <CheckCircle2 className="h-4 w-4 text-fmt-xls" />}
                  {i.status === "error" && <TriangleAlert className="h-4 w-4 text-destructive" />}
                </span>
                <div className="min-w-0 flex-1 basis-60">
                  <Input value={i.title} disabled={i.status === "uploading" || i.status === "done"} aria-label={`Title for ${i.file.name}`}
                    onChange={(e) => patch(i.id, { title: e.target.value })} />
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {i.file.name} · {formatBytes(i.file.size)}
                    {i.status === "done" && " · Uploaded"}
                    {i.error && <span role="alert" className="text-destructive"> · {i.error}</span>}
                  </p>
                </div>
                {i.status !== "uploading" && i.status !== "done" && (
                  <Button variant="ghost" size="sm" aria-label={`Remove ${i.file.name}`} onClick={() => setItems((cur) => cur.filter((x) => x.id !== i.id))}><X className="h-4 w-4" /></Button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={running || uploadable.length === 0} onClick={run}>
              {running ? "Uploading…" : `Upload ${uploadable.length} ${uploadable.length === 1 ? "file" : "files"}`}
            </Button>
            {done > 0 && <Button variant="outline" disabled={running} onClick={() => setItems((cur) => cur.filter((i) => i.status !== "done"))}>Clear uploaded</Button>}
            <Link href="/admin/resources" className={buttonVariants({ variant: "ghost" })}>Back to resources</Link>
          </div>
        </>
      )}
    </div>
  );
}
