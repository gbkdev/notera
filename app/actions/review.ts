"use server";

import { refreshCatalog } from "@/lib/revalidate";
import { getAdmin } from "@/lib/auth";
import { EXT_MIME, type FileExt } from "@/lib/formats";
import { RESOURCE_BUCKET } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import { checkFileContent, resourceSchema } from "@/lib/validation";
import { UUID_RE } from "@/lib/utils";

async function admin() {
  const a = await getAdmin();
  if (!a) throw new Error("UNAUTHORIZED");
  return a;
}
async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try { return await fn(); }
  catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return { ok: false, error: "Your session has ended. Sign in again." };
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
const refresh = refreshCatalog;
const bad = (m = "That item doesn’t exist."): ActionResult => ({ ok: false, error: m });

/* ----------------------------------- requests ----------------------------------- */
export async function setRequestStatus(id: string, status: "open" | "fulfilled" | "dismissed") {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id) || !["open", "fulfilled", "dismissed"].includes(status)) return bad();
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh();
    return { ok: true };
  });
}

export async function deleteRequest(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return bad();
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh();
    return { ok: true };
  });
}

/* --------------------------------- submissions ---------------------------------- */
/** Publishes a student's file: moves it to the public bucket and creates the resource. */
export async function approveSubmission(id: string, values: unknown) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return bad();
    const meta = resourceSchema.safeParse({ ...(values as object), featured: false });
    if (!meta.success) return bad("Check the title, category and course, then try again.");

    const { data: sub } = await supabase.from("submissions").select("*").eq("id", id).maybeSingle();
    if (!sub || sub.status !== "pending") return bad("This submission was already handled.");

    const dl = await supabase.storage.from("submissions").download(sub.file_path);
    if (dl.error || !dl.data) return bad("Couldn’t read the uploaded file.");
    const bytes = new Uint8Array(await dl.data.arrayBuffer());
    const ext = sub.file_ext as FileExt;
    const content = checkFileContent(ext, bytes); // re-check: never trust what sat in storage
    if (content) return bad(content);

    const publicPath = `${meta.data.course_id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from(RESOURCE_BUCKET).upload(publicPath, bytes, { contentType: EXT_MIME[ext], upsert: false });
    if (up.error) return bad("Couldn’t publish the file. Try again.");

    const { data: created, error } = await supabase.from("resources").insert({
      ...meta.data, file_path: publicPath, file_name: sub.file_name, file_ext: ext, file_size: bytes.byteLength,
    }).select("id").single();
    if (error || !created) {
      await supabase.storage.from(RESOURCE_BUCKET).remove([publicPath]);
      return { ok: false, error: error?.message ?? "Couldn’t create the resource." };
    }
    await supabase.from("submissions").update({ status: "approved", resource_id: created.id }).eq("id", id);
    await supabase.storage.from("submissions").remove([sub.file_path]);
    refresh();
    return { ok: true };
  });
}

export async function rejectSubmission(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return bad();
    const { data: sub } = await supabase.from("submissions").select("file_path, status").eq("id", id).maybeSingle();
    if (!sub || sub.status !== "pending") return bad("This submission was already handled.");
    const { error } = await supabase.from("submissions").update({ status: "rejected" }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await supabase.storage.from("submissions").remove([sub.file_path]);
    refresh();
    return { ok: true };
  });
}

export async function deleteSubmission(id: string) {
  return run(async () => {
    const { supabase } = await admin();
    if (!UUID_RE.test(id)) return bad();
    const { data: sub } = await supabase.from("submissions").select("file_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (sub) await supabase.storage.from("submissions").remove([sub.file_path]);
    refresh();
    return { ok: true };
  });
}
