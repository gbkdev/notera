"use server";

import { createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { ALLOWED_EXTS, EXT_MIME, type FileExt } from "@/lib/formats";
import { requestSchema, shareSchema, SUBMISSION_MAX } from "@/lib/contribute";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import type { ActionResult } from "@/lib/types";
import { checkFileBasics, checkFileContent, extOf } from "@/lib/validation";

const DAILY_PER_BROWSER = 5;
const DAILY_PER_NETWORK = 5;
const MAX_PENDING = 150;

/** Per-browser daily allowance, kept in a cookie. */
async function allowance(name: string) {
  const jar = await cookies();
  const n = parseInt(jar.get(name)?.value ?? "0", 10) || 0;
  return {
    over: n >= DAILY_PER_BROWSER,
    bump: () => jar.set(name, String(n + 1), { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", path: "/" }),
  };
}

/* --------------------------------- "I can't find it" ---------------------------------- */
export async function submitRequest(values: unknown): Promise<ActionResult> {
  if (values && typeof values === "object" && (values as { website?: string }).website) return { ok: true }; // bot
  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const limit = await allowance("nt_req");
  if (limit.over) return { ok: false, error: "You’ve sent several requests today. Please try again tomorrow." };

  const v = parsed.data;
  const { error } = await createPublicClient().from("requests").insert({
    department_id: v.department_id || null,
    department_text: v.department_id ? "" : v.department_text,
    course_id: v.course_id || null,
    course_text: v.course_id ? "" : v.course_text,
    title: v.title, details: v.details, category: v.category || null, contact: v.contact,
  });
  if (error) return { ok: false, error: "Couldn’t send your request right now. Please try again later." };
  limit.bump();
  return { ok: true };
}

/* --------------------------------- "I have the file" ---------------------------------- */
export async function submitContribution(form: FormData): Promise<ActionResult> {
  if (form.get("website")) return { ok: true }; // bot
  if (!hasServiceKey()) return { ok: false, error: "Uploads from students aren’t switched on yet." };

  const get = (k: string) => String(form.get(k) ?? "");
  const parsed = shareSchema.safeParse({
    department_id: get("department_id"), department_text: get("department_text"),
    course_id: get("course_id"), course_text: get("course_text"),
    title: get("title"), description: get("description"), category: get("category"),
    contact: get("contact"), rights: get("rights") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  // The file: type, size and real content, checked on the server.
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  const basics = checkFileBasics(file);
  if (basics) return { ok: false, error: basics };
  if (file.size > SUBMISSION_MAX) return { ok: false, error: "Files from students can be up to 25 MB." };
  const ext = extOf(file.name) as FileExt;
  if (!ALLOWED_EXTS.includes(ext)) return { ok: false, error: "That file type isn’t supported." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const content = checkFileContent(ext, bytes);
  if (content) return { ok: false, error: content };

  const limit = await allowance("nt_sub");
  if (limit.over) return { ok: false, error: "You’ve shared several files today. Thank you! Please try again tomorrow." };

  const v = parsed.data;
  if (v.course_id) {
    const { data } = await createPublicClient().from("courses").select("id").eq("id", v.course_id).maybeSingle();
    if (!data) return { ok: false, error: "That course no longer exists. Pick another." };
  }

  const service = createServiceClient();
  // Abuse guards: a cap per network address (stored only as a keyed hash) and a cap on the review queue.
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(ip).digest("hex").slice(0, 32);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [mine, pending] = await Promise.all([
    service.from("submissions").select("*", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    service.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  if (mine.error || pending.error) return { ok: false, error: "Uploads aren’t available right now. Please try again later." };
  if ((mine.count ?? 0) >= DAILY_PER_NETWORK) return { ok: false, error: "Too many files from your network today. Please try again tomorrow." };
  if ((pending.count ?? 0) >= MAX_PENDING) return { ok: false, error: "We have a lot waiting for review. Please try again in a few days." };

  const path = `${crypto.randomUUID()}.${ext}`;
  const up = await service.storage.from("submissions").upload(path, bytes, { contentType: EXT_MIME[ext], upsert: false });
  if (up.error) return { ok: false, error: "The file couldn’t be uploaded. Please try again." };

  const { error } = await service.from("submissions").insert({
    course_id: v.course_id || null,
    department_text: v.course_id ? "" : v.department_text,
    course_text: v.course_id ? "" : v.course_text,
    title: v.title, description: v.description, category: v.category,
    file_path: path, file_name: file.name.slice(0, 200), file_ext: ext, file_size: bytes.byteLength,
    contact: v.contact, ip_hash: ipHash,
  });
  if (error) {
    await service.storage.from("submissions").remove([path]); // never leave an orphan file
    return { ok: false, error: "Couldn’t save your submission. Please try again." };
  }
  limit.bump();
  return { ok: true };
}
