import { z } from "zod";
import { REPORT_REASON_VALUES } from "@/lib/constants";

export const reportSchema = z.object({
  resource_id: z.string().uuid(),
  reason: z.enum(REPORT_REASON_VALUES),
  message: z.string().trim().max(500, "Keep it under 500 characters"),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
}).refine((v) => v.reason !== "other" || v.message.length >= 5, { path: ["message"], message: "Tell us a little more" });
