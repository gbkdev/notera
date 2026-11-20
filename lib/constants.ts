import {
  BookOpen, Building2, Calculator, Cpu, FlaskConical, GraduationCap, Landmark,
  Languages, Leaf, Palette, Scale, Stethoscope, type LucideIcon,
  FileText, ClipboardList, PenLine, Presentation, Library,
} from "lucide-react";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — keep in sync with the bucket limit
export const PAGE_SIZE = 12;

export const CATEGORIES = [
  { value: "lecture_notes", label: "Lecture Notes", icon: FileText, blurb: "Weekly notes and summaries" },
  { value: "assignment", label: "Assignments", icon: ClipboardList, blurb: "Problem sets and coursework" },
  { value: "exam", label: "Exams", icon: PenLine, blurb: "Past papers and revision" },
  { value: "presentation", label: "Presentations", icon: Presentation, blurb: "Slide decks" },
  { value: "reference", label: "References", icon: Library, blurb: "Textbooks and readings" },
] as const;
export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]];

// File-type definitions live in lib/formats.ts (re-exported so existing imports keep working).
export { ALLOWED_EXTS, EXT_MIME, FORMAT_GROUPS, FORMAT_STYLE, formatGroupOf, type FileExt } from "@/lib/formats";

export const DEPARTMENT_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  "graduation-cap": { label: "Graduation cap", Icon: GraduationCap },
  "flask-conical": { label: "Science", Icon: FlaskConical },
  cpu: { label: "Computing", Icon: Cpu },
  stethoscope: { label: "Health", Icon: Stethoscope },
  scale: { label: "Law", Icon: Scale },
  landmark: { label: "Humanities", Icon: Landmark },
  "book-open": { label: "Literature", Icon: BookOpen },
  calculator: { label: "Mathematics", Icon: Calculator },
  "building-2": { label: "Engineering", Icon: Building2 },
  palette: { label: "Arts", Icon: Palette },
  languages: { label: "Languages", Icon: Languages },
  leaf: { label: "Agriculture", Icon: Leaf },
};
export const ICON_NAMES = Object.keys(DEPARTMENT_ICONS) as [string, ...string[]];

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A to Z" },
  { value: "popular", label: "Most downloaded" },
] as const;

export const REPORT_REASONS = [
  { value: "broken_file", label: "The file won’t open or download" },
  { value: "wrong_content", label: "It isn’t what the title says" },
  { value: "wrong_course", label: "It’s in the wrong course" },
  { value: "copyright", label: "It shouldn’t be shared publicly (copyright)" },
  { value: "other", label: "Something else" },
] as const;
export const REPORT_REASON_VALUES = REPORT_REASONS.map((r) => r.value) as [string, ...string[]];
export const LARGE_FILE = 10 * 1024 * 1024; // sizes at or above this are flagged on cards
