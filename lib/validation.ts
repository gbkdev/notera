import { z } from "zod";
import { ALLOWED_EXTS, CATEGORY_VALUES, ICON_NAMES, MAX_FILE_SIZE, type FileExt } from "@/lib/constants";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(120),
  slug: z.string().trim().toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
  description: z.string().trim().max(400, "Keep it under 400 characters"),
  icon: z.enum(ICON_NAMES),
});

export const yearSchema = z.object({
  label: z.string().trim().min(1, "Enter a label").max(60),
  sort_order: z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(1000),
});

export const semesterSchema = z.object({
  academic_year_id: z.string().uuid("Choose an academic year"),
  name: z.string().trim().min(1, "Enter a name").max(60),
  sort_order: z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(1000),
});

export const courseSchema = z.object({
  department_id: z.string().uuid("Choose a department"),
  semester_id: z.string().uuid("Choose a semester"),
  code: z.string().trim().min(1, "Enter a course code").max(20),
  name: z.string().trim().min(2, "Enter at least 2 characters").max(160),
  description: z.string().trim().max(400, "Keep it under 400 characters"),
});

export const resourceSchema = z.object({
  course_id: z.string().uuid("Choose a course"),
  title: z.string().trim().min(2, "Enter at least 2 characters").max(200),
  description: z.string().trim().max(500, "Keep it under 500 characters"),
  category: z.enum(CATEGORY_VALUES),
  featured: z.boolean(),
});

export type DepartmentValues = z.infer<typeof departmentSchema>;
export type YearValues = z.infer<typeof yearSchema>;
export type SemesterValues = z.infer<typeof semesterSchema>;
export type CourseValues = z.infer<typeof courseSchema>;
export type ResourceValues = z.infer<typeof resourceSchema>;

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

/** Cheap checks usable in the browser: extension and size. */
export function checkFileBasics(file: { name: string; size: number }): string | null {
  const ext = extOf(file.name);
  if (!(ALLOWED_EXTS as readonly string[]).includes(ext)) return "Use a PDF, PowerPoint, Word or Excel file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_FILE_SIZE) return "Files can be up to 50 MB.";
  return null;
}

/** Server-side: also verify the file's real content (magic bytes), not just its name. */
export function checkFileContent(ext: FileExt, bytes: Uint8Array): string | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === "pdf") return starts([0x25, 0x50, 0x44, 0x46]) ? null : "This file isn't a valid PDF.";
  if (ext === "doc" || ext === "ppt" || ext === "xls")
    return starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) ? null : `This file isn't a valid .${ext} document.`;
  // docx / pptx / xlsx are ZIP containers with a known top-level folder.
  if (!starts([0x50, 0x4b, 0x03, 0x04])) return `This file isn't a valid .${ext} document.`;
  const marker = ext === "docx" ? "word/" : ext === "pptx" ? "ppt/" : "xl/";
  const text = Buffer.from(bytes).toString("latin1");
  return text.includes(marker) ? null : `This file isn't a valid .${ext} document.`;
}
