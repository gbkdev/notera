import { z } from "zod";
import { ICON_NAMES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const departmentItem = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().max(120).optional(),
  description: z.string().trim().max(400).default(""),
  icon: z.enum(ICON_NAMES).default("graduation-cap"),
});
const semesterItem = z.object({
  name: z.string().trim().min(1).max(60),
  sort_order: z.number().int().min(0).max(1000).optional(),
});
const yearItem = z.object({
  label: z.string().trim().min(1).max(60),
  sort_order: z.number().int().min(0).max(1000).optional(),
  semesters: z.array(semesterItem).max(10).default([]),
});
const courseItem = z.object({
  department: z.string().trim().min(1),
  year: z.string().trim().min(1),
  semester: z.string().trim().min(1),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(400).default(""),
});

export const catalogSchema = z
  .object({
    departments: z.array(departmentItem).max(100).default([]),
    academic_years: z.array(yearItem).max(20).default([]),
    courses: z.array(courseItem).max(500).default([]),
  })
  .strict();
export type CatalogInput = z.output<typeof catalogSchema>;

export type Summary = Record<"departments" | "academic_years" | "semesters" | "courses", { create: number; skip: number }>;
export type ImportResult =
  | { ok: true; dryRun: boolean; summary: Summary }
  | { ok: false; errors: string[] };

export const MAX_IMPORT_CHARS = 1_000_000;

export const TEMPLATE = {
  departments: [
    { name: "Computer Science", slug: "computer-science", description: "Programming, systems and software engineering.", icon: "cpu" },
    { name: "Mathematics", description: "Pure and applied mathematics.", icon: "calculator" },
  ],
  academic_years: [
    { label: "Year 1", sort_order: 1, semesters: [{ name: "Semester 1", sort_order: 1 }, { name: "Semester 2", sort_order: 2 }] },
    { label: "Year 2", sort_order: 2, semesters: [{ name: "Semester 1", sort_order: 1 }, { name: "Semester 2", sort_order: 2 }] },
  ],
  courses: [
    { department: "computer-science", year: "Year 1", semester: "Semester 1", code: "CS101", name: "Introduction to Programming" },
    { department: "Mathematics", year: "Year 1", semester: "Semester 1", code: "MATH101", name: "Calculus I", description: "Limits, derivatives and integrals." },
  ],
};

export type Existing = {
  depts: { id: string; name: string; slug: string }[];
  years: { id: string; label: string }[];
  sems: { id: string; academic_year_id: string; name: string }[];
  courses: { department_id: string; semester_id: string; code: string }[];
};

const low = (s: string) => s.trim().toLowerCase();

export function formatZodErrors(error: z.ZodError) {
  return error.issues.slice(0, 20).map((i) => {
    const path = i.path.map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`)).join("").replace(/^\./, "");
    return `${path || "file"}: ${i.message}`;
  });
}

/** Works out what would be created and what already exists, without touching the database. */
export function buildPlan(data: CatalogInput, ex: Existing) {
  const errors: string[] = [];

  // Departments (a course may refer to a department by slug or by name)
  const deptRef = new Map<string, string>();
  for (const d of ex.depts) { deptRef.set(low(d.slug), d.slug); deptRef.set(low(d.name), d.slug); }
  const newDepts: { name: string; slug: string; description: string; icon: string }[] = [];
  let deptSkip = 0;
  data.departments.forEach((d, i) => {
    const slug = d.slug || slugify(d.name);
    if (!slug || !SLUG_RE.test(slug)) {
      errors.push(`departments[${i}]: can't build a URL name for "${d.name}". Add a "slug" using lowercase letters, numbers and hyphens.`);
      return;
    }
    const canon = deptRef.get(low(slug)) ?? deptRef.get(low(d.name));
    if (canon) { deptSkip++; deptRef.set(low(slug), canon); deptRef.set(low(d.name), canon); return; }
    deptRef.set(low(slug), slug); deptRef.set(low(d.name), slug);
    newDepts.push({ name: d.name, slug, description: d.description, icon: d.icon });
  });

  // Academic years and semesters
  const yearKeys = new Set(ex.years.map((y) => low(y.label)));
  const yearLabelById = new Map(ex.years.map((y) => [y.id, low(y.label)]));
  const semKeys = new Set<string>();
  const semKeyById = new Map<string, string>();
  for (const s of ex.sems) {
    const yl = yearLabelById.get(s.academic_year_id);
    if (yl) { const k = `${yl}|${low(s.name)}`; semKeys.add(k); semKeyById.set(s.id, k); }
  }
  const newYears: { label: string; sort_order: number }[] = [];
  const newSems: { year_label: string; name: string; sort_order: number }[] = [];
  let yearSkip = 0, semSkip = 0;
  data.academic_years.forEach((y, i) => {
    const yl = low(y.label);
    if (yearKeys.has(yl)) yearSkip++;
    else { yearKeys.add(yl); newYears.push({ label: y.label, sort_order: y.sort_order ?? i + 1 }); }
    y.semesters.forEach((s, j) => {
      const k = `${yl}|${low(s.name)}`;
      if (semKeys.has(k)) semSkip++;
      else { semKeys.add(k); newSems.push({ year_label: y.label, name: s.name, sort_order: s.sort_order ?? j + 1 }); }
    });
  });

  // Courses
  const deptSlugById = new Map(ex.depts.map((d) => [d.id, low(d.slug)]));
  const courseKeys = new Set(
    ex.courses.map((c) => `${deptSlugById.get(c.department_id)}|${semKeyById.get(c.semester_id)}|${low(c.code)}`)
  );
  const newCourses: { dept_slug: string; year_label: string; sem_name: string; code: string; name: string; description: string }[] = [];
  let courseSkip = 0;
  data.courses.forEach((c, i) => {
    const slug = deptRef.get(low(c.department));
    if (!slug) {
      errors.push(`courses[${i}] ${c.code}: department "${c.department}" doesn't exist. Add it under "departments" or fix the name.`);
      return;
    }
    const semKey = `${low(c.year)}|${low(c.semester)}`;
    if (!semKeys.has(semKey)) {
      errors.push(`courses[${i}] ${c.code}: "${c.year}" / "${c.semester}" doesn't exist. Add it under "academic_years" or fix the names.`);
      return;
    }
    const key = `${low(slug)}|${semKey}|${low(c.code)}`;
    if (courseKeys.has(key)) { courseSkip++; return; }
    courseKeys.add(key);
    newCourses.push({ dept_slug: slug, year_label: c.year, sem_name: c.semester, code: c.code, name: c.name, description: c.description });
  });

  const summary: Summary = {
    departments: { create: newDepts.length, skip: deptSkip },
    academic_years: { create: newYears.length, skip: yearSkip },
    semesters: { create: newSems.length, skip: semSkip },
    courses: { create: newCourses.length, skip: courseSkip },
  };
  return { errors, summary, newDepts, newYears, newSems, newCourses };
}
