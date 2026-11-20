"use server";

import { refreshCatalog } from "@/lib/revalidate";
import { getAdmin } from "@/lib/auth";
import { buildPlan, catalogSchema, formatZodErrors, MAX_IMPORT_CHARS, type Existing, type ImportResult } from "@/lib/catalog-import";

const low = (s: string) => s.trim().toLowerCase();
const chunk = <T,>(xs: T[], n = 200) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

export async function importCatalog(text: string, dryRun: boolean): Promise<ImportResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, errors: ["Your session has ended. Sign in again."] };
  const { supabase } = admin;

  if (typeof text !== "string" || !text.trim()) return { ok: false, errors: ["Add a JSON file or paste JSON first."] };
  if (text.length > MAX_IMPORT_CHARS) return { ok: false, errors: ["That file is too large. Split it into smaller files (under 1 MB each)."] };

  let raw: unknown;
  try { raw = JSON.parse(text); }
  catch (e) { return { ok: false, errors: [`This isn't valid JSON: ${e instanceof Error ? e.message : "parse error"}`] }; }

  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed.error) };
  const data = parsed.data;
  if (!data.departments.length && !data.academic_years.length && !data.courses.length)
    return { ok: false, errors: ['The file is empty. Add at least one of "departments", "academic_years" or "courses".'] };

  const load = async (): Promise<Existing> => {
    const [d, y, s, c] = await Promise.all([
      supabase.from("departments").select("id, name, slug"),
      supabase.from("academic_years").select("id, label"),
      supabase.from("semesters").select("id, academic_year_id, name"),
      supabase.from("courses").select("department_id, semester_id, code"),
    ]);
    return { depts: d.data ?? [], years: y.data ?? [], sems: s.data ?? [], courses: c.data ?? [] };
  };

  const plan = buildPlan(data, await load());
  if (plan.errors.length) return { ok: false, errors: plan.errors.slice(0, 30) };
  if (dryRun) return { ok: true, dryRun: true, summary: plan.summary };

  // Nothing is overwritten: only new rows are inserted. If a step fails, re-running the same file
  // picks up where it stopped because rows that already exist are skipped.
  const fail = (what: string, message: string): ImportResult => ({
    ok: false, errors: [`Couldn't add ${what}: ${message}. Rows added before this step were kept; fix the file and import it again.`],
  });

  if (plan.newDepts.length) {
    const { error } = await supabase.from("departments").insert(plan.newDepts);
    if (error) return fail("departments", error.message);
  }
  if (plan.newYears.length) {
    const { error } = await supabase.from("academic_years").insert(plan.newYears);
    if (error) return fail("academic years", error.message);
  }

  let ex = await load();
  if (plan.newSems.length) {
    const yearId = new Map(ex.years.map((y) => [low(y.label), y.id]));
    const rows = plan.newSems.map((s) => ({ academic_year_id: yearId.get(low(s.year_label))!, name: s.name, sort_order: s.sort_order }));
    const { error } = await supabase.from("semesters").insert(rows);
    if (error) return fail("semesters", error.message);
    ex = await load();
  }

  if (plan.newCourses.length) {
    const deptId = new Map(ex.depts.map((d) => [low(d.slug), d.id]));
    const yearLabel = new Map(ex.years.map((y) => [y.id, low(y.label)]));
    const semId = new Map(ex.sems.map((s) => [`${yearLabel.get(s.academic_year_id)}|${low(s.name)}`, s.id]));
    const rows = plan.newCourses.map((c) => ({
      department_id: deptId.get(low(c.dept_slug))!,
      semester_id: semId.get(`${low(c.year_label)}|${low(c.sem_name)}`)!,
      code: c.code, name: c.name, description: c.description,
    }));
    for (const part of chunk(rows)) {
      const { error } = await supabase.from("courses").insert(part);
      if (error) return fail("courses", error.message);
    }
  }

  refreshCatalog();
  return { ok: true, dryRun: false, summary: plan.summary };
}
