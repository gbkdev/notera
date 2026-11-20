import { z } from "zod";
import { CATEGORY_VALUES } from "@/lib/constants";

export const SUBMISSION_MAX = 25 * 1024 * 1024; // students: 25 MB (admins can upload up to 50 MB)
export const OTHER = "__other__";

const uuidOrEmpty = z.union([z.string().uuid(), z.literal("")]);
const place = {
  department_id: uuidOrEmpty,
  department_text: z.string().trim().max(120),
  course_id: uuidOrEmpty,
  course_text: z.string().trim().max(160),
  contact: z.string().trim().max(120, "Keep contact details under 120 characters"),
  website: z.string().max(0).optional(), // honeypot
};

export const requestSchema = z.object({
  ...place,
  title: z.string().trim().min(2, "Tell us what you’re looking for").max(200),
  details: z.string().trim().max(500, "Keep details under 500 characters"),
  category: z.union([z.enum(CATEGORY_VALUES), z.literal("")]),
}).refine((v) => v.department_id || v.department_text.length >= 2, {
  path: ["department_text"], message: "Choose your department, or type its name",
});

export const shareSchema = z.object({
  ...place,
  title: z.string().trim().min(2, "Give the file a title").max(200),
  description: z.string().trim().max(500, "Keep the description under 500 characters"),
  category: z.enum(CATEGORY_VALUES),
  rights: z.literal(true, { errorMap: () => ({ message: "Please confirm you’re allowed to share this file" }) }),
}).refine((v) => v.course_id || (v.department_text.length >= 2 && v.course_text.length >= 2), {
  path: ["course_text"], message: "Choose your course, or type its department and course name",
});
