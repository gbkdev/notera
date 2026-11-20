"use server";

import { refreshCatalog } from "@/lib/revalidate";
import { getAdmin } from "@/lib/auth";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { ALLOWED_EXTS, EXT_MIME, type FileExt } from "@/lib/formats";
import { RESOURCE_BUCKET } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import {
  checkFileBasics, checkFileContent, courseSchema, departmentSchema, extOf,
  resourceSchema, semesterSchema, yearSchema,
} from "@/lib/validation";
import { UUID_RE } from "@/lib/utils";

type PgError = { code?: string; message: string } | null;

function friendly(error: NonNullable<PgError>, noun: string): string {
  if (error.code === "23505") return `A ${noun} with those details already exists.`;
  if (error.code === "23503") return `This ${noun} is still in use. Remove or move what's inside it first.`;
  if (error.code === "42501") return "You don't have permission to do that.";
  return error.message;
}

const refresh = refreshCatalog;

/** Every action starts here: the caller must be a signed-in administrator. */
async function admin() {
  const a = await getAdmin();
  if (!a) throw new Error("UNAUTHORIZED");
  return a;
}

async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return { ok: false, error: "Your session has ended. Sign in again." };
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

const invalid = (msg = "Check the highlighted fields and try again."): ActionResult => ({ ok: false, error: msg });

/* ---------------------------------- departments --------------------------------- */
export async function saveDepartment(values: unknown, id?: string) {
  return run(async () => {
    const { supabase } = await admin();
    const parsed = departmentSchema.safeParse(values);
    if (!parsed.success) return invalid();
    const { error } = id
      ? await supabase.from("departments").update(parsed.data).eq("id", id)
      : await supabase.from("departments").insert(parsed.data);
    if (error) return { ok: false, error: friendly(error, "department") };
    refresh();
    return { ok: true };
  });
}

export async function deleteDepartment(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "department") };
    refresh();
    return { ok: true };
  });
}

/* ------------------------------ years and semesters ----------------------------- */
export async function saveYear(values: unknown, id?: string) {
  return run(async () => {
    const { supabase } = await admin();
    const parsed = yearSchema.safeParse(values);
    if (!parsed.success) return invalid();
    const { error } = id
      ? await supabase.from("academic_years").update(parsed.data).eq("id", id)
      : await supabase.from("academic_years").insert(parsed.data);
    if (error) return { ok: false, error: friendly(error, "academic year") };
    refresh();
    return { ok: true };
  });
}

export async function deleteYear(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "academic year") };
    refresh();
    return { ok: true };
  });
}

export async function saveSemester(values: unknown, id?: string) {
  return run(async () => {
    const { supabase } = await admin();
    const parsed = semesterSchema.safeParse(values);
    if (!parsed.success) return invalid();
    const { error } = id
      ? await supabase.from("semesters").update(parsed.data).eq("id", id)
      : await supabase.from("semesters").insert(parsed.data);
    if (error) return { ok: false, error: friendly(error, "semester") };
    refresh();
    return { ok: true };
  });
}

export async function deleteSemester(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    const { error } = await supabase.from("semesters").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "semester") };
    refresh();
    return { ok: true };
  });
}

/* ----------------------------------- courses ------------------------------------ */
export async function saveCourse(values: unknown, id?: string) {
  return run(async () => {
    const { supabase } = await admin();
    const parsed = courseSchema.safeParse(values);
    if (!parsed.success) return invalid();
    const { error } = id
      ? await supabase.from("courses").update(parsed.data).eq("id", id)
      : await supabase.from("courses").insert(parsed.data);
    if (error) return { ok: false, error: friendly(error, "course") };
    refresh();
    return { ok: true };
  });
}

export async function deleteCourse(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "course") };
    refresh();
    return { ok: true };
  });
}

/* ---------------------------------- resources ----------------------------------- */
async function readUpload(form: FormData): Promise<
  { ok: true; ext: FileExt; bytes: Uint8Array; name: string } | { ok: false; error: string } | null
> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return null; // no file provided
  const basics = checkFileBasics(file);
  if (basics) return { ok: false, error: basics };
  const ext = extOf(file.name) as FileExt;
  if (!ALLOWED_EXTS.includes(ext) || file.size > MAX_FILE_SIZE) return { ok: false, error: "Unsupported file." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const content = checkFileContent(ext, bytes);
  if (content) return { ok: false, error: content };
  return { ok: true, ext, bytes, name: file.name.slice(0, 200) };
}

function readMeta(form: FormData) {
  return resourceSchema.safeParse({
    course_id: form.get("course_id"),
    title: form.get("title"),
    description: form.get("description") ?? "",
    category: form.get("category"),
    featured: form.get("featured") === "true",
  });
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof admin>>["supabase"],
  courseId: string, ext: FileExt, bytes: Uint8Array
) {
  const path = `${courseId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(RESOURCE_BUCKET)
    .upload(path, bytes, { contentType: EXT_MIME[ext], upsert: false });
  return { path, error };
}

export async function createResource(form: FormData) {
  return run(async () => {
    const { supabase } = await admin();
    const meta = readMeta(form);
    if (!meta.success) return invalid();
    const upload = await readUpload(form);
    if (!upload) return { ok: false, error: "Choose a file to upload." };
    if (!upload.ok) return upload;

    const { path, error: upErr } = await uploadFile(supabase, meta.data.course_id, upload.ext, upload.bytes);
    if (upErr) return { ok: false, error: "The file couldn't be uploaded. Try again." };

    const { error } = await supabase.from("resources").insert({
      ...meta.data, file_path: path, file_name: upload.name, file_ext: upload.ext, file_size: upload.bytes.byteLength,
    });
    if (error) {
      await supabase.storage.from(RESOURCE_BUCKET).remove([path]); // don't leave an orphan
      return { ok: false, error: friendly(error, "resource") };
    }
    refresh();
    return { ok: true };
  });
}

export async function updateResource(id: string, form: FormData) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return invalid("That resource doesn't exist.");
    const meta = readMeta(form);
    if (!meta.success) return invalid();
    const { data: current } = await supabase.from("resources").select("file_path").eq("id", id).maybeSingle();
    if (!current) return invalid("That resource doesn't exist.");

    const upload = await readUpload(form);
    if (upload && !upload.ok) return upload;

    let fileFields = {};
    let newPath: string | null = null;
    if (upload) {
      const res = await uploadFile(supabase, meta.data.course_id, upload.ext, upload.bytes);
      if (res.error) return { ok: false, error: "The file couldn't be uploaded. Try again." };
      newPath = res.path;
      fileFields = { file_path: res.path, file_name: upload.name, file_ext: upload.ext, file_size: upload.bytes.byteLength };
    }
    const { error } = await supabase.from("resources").update({ ...meta.data, ...fileFields }).eq("id", id);
    if (error) {
      if (newPath) await supabase.storage.from(RESOURCE_BUCKET).remove([newPath]);
      return { ok: false, error: friendly(error, "resource") };
    }
    if (newPath) await supabase.storage.from(RESOURCE_BUCKET).remove([current.file_path]);
    refresh();
    return { ok: true };
  });
}

export async function deleteResource(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    const { data: row } = await supabase.from("resources").select("file_path").eq("id", id).maybeSingle();
    if (!row) return invalid("That resource doesn't exist.");
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "resource") };
    await supabase.storage.from(RESOURCE_BUCKET).remove([row.file_path]);
    refresh();
    return { ok: true };
  });
}

export async function setFeatured(id: string, featured: boolean) {
  return run(async () => {
    const { supabase } = await admin();
    const { error } = await supabase.from("resources").update({ featured }).eq("id", id);
    if (error) return { ok: false, error: friendly(error, "resource") };
    refresh();
    return { ok: true };
  });
}

/* ----------------------------------- reports ------------------------------------ */
export async function setReportStatus(id: string, status: "open" | "resolved") {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id) || (status !== "open" && status !== "resolved")) return invalid();
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) return { ok: false, error: friendly(error, "report") };
    refresh();
    return { ok: true };
  });
}

export async function deleteReport(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return invalid();
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error, "report") };
    refresh();
    return { ok: true };
  });
}
