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

export const FORMAT_GROUPS = [
  { value: "pdf", label: "PDF", exts: ["pdf"] },
  { value: "ppt", label: "PowerPoint", exts: ["ppt", "pptx"] },
  { value: "doc", label: "Word", exts: ["doc", "docx"] },
  { value: "xls", label: "Excel", exts: ["xls", "xlsx"] },
] as const;

export const ALLOWED_EXTS = ["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx"] as const;
export type FileExt = (typeof ALLOWED_EXTS)[number];

export const EXT_MIME: Record<FileExt, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Full class names are written out so Tailwind can see them.
export const FORMAT_STYLE: Record<string, { label: string; spine: string; chip: string }> = {
  pdf: { label: "PDF", spine: "bg-fmt-pdf", chip: "bg-fmt-pdf/15 text-fmt-pdf" },
  ppt: { label: "PPT", spine: "bg-fmt-ppt", chip: "bg-fmt-ppt/15 text-fmt-ppt" },
  doc: { label: "DOC", spine: "bg-fmt-doc", chip: "bg-fmt-doc/15 text-fmt-doc" },
  xls: { label: "XLS", spine: "bg-fmt-xls", chip: "bg-fmt-xls/15 text-fmt-xls" },
};
export function formatGroupOf(ext: string) {
  return ext.startsWith("ppt") ? "ppt" : ext.startsWith("doc") ? "doc" : ext.startsWith("xls") ? "xls" : "pdf";
}

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
] as const;
