import { z } from "zod";
import { CATEGORY_VALUES, ICON_NAMES, MAX_FILE_SIZE } from "@/lib/constants";
import { ALLOWED_EXTS, FORMATS, SUPPORTED_HINT, type FileExt } from "@/lib/formats";

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
  if (!(ALLOWED_EXTS as readonly string[]).includes(ext)) return `That file type isn’t supported. Use ${SUPPORTED_HINT}.`;
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_FILE_SIZE) return "Files can be up to 50 MB.";
  return null;
}

/** Server-side: verify the file's real content (signature bytes), not just its name. */
export function checkFileContent(ext: FileExt, bytes: Uint8Array): string | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  const bad = `This file isn’t a valid .${ext} file.`;
  const latin = (end: number) => Buffer.from(bytes.subarray(0, end)).toString("latin1");
  const isZip = starts([0x50, 0x4b, 0x03, 0x04]);

  switch (FORMATS[ext].magic) {
    case "pdf": return starts([0x25, 0x50, 0x44, 0x46]) ? null : bad;
    case "ole": return starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) ? null : bad;
    case "ooxml-word": return isZip && latin(bytes.length).includes("word/") ? null : bad;
    case "ooxml-ppt": return isZip && latin(bytes.length).includes("ppt/") ? null : bad;
    case "ooxml-xl": return isZip && latin(bytes.length).includes("xl/") ? null : bad;
    case "odf": return isZip && latin(2048).includes("application/vnd.oasis.opendocument") ? null : bad;
    case "rtf": return starts([0x7b, 0x5c, 0x72, 0x74, 0x66]) ? null : bad;
    case "text": {
      // Plain text must not contain binary bytes (UTF-8 is fine; save UTF-16 files as UTF-8).
      for (let i = 0; i < Math.min(bytes.length, 8192); i++) if (bytes[i] === 0) return `This doesn’t look like a text file. Save it as UTF-8 and try again.`;
      return null;
    }
    case "png": return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : bad;
    case "jpg": return starts([0xff, 0xd8, 0xff]) ? null : bad;
    case "gif": return starts([0x47, 0x49, 0x46, 0x38]) ? null : bad;
    case "webp": return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8) ? null : bad;
    case "zip": return isZip ? null : bad;
    case "7z": return starts([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]) ? null : bad;
    case "rar": return starts([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]) ? null : bad;
  }
}
