"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CATEGORIES } from "@/lib/constants";
import { requestSchema } from "@/lib/contribute";
import { submitRequest } from "@/app/actions/contribute";
import { StudentCoursePicker } from "@/components/student-course-picker";
import { locPayload, type Loc } from "@/lib/loc";
import type { CourseOption } from "@/components/admin/course-options";

export function RequestForm({ departments, courses, initialLoc, initialTitle }: {
  departments: { id: string; name: string }[]; courses: CourseOption[]; initialLoc: Loc; initialTitle: string;
}) {
  const [loc, setLoc] = useState<Loc>(initialLoc);
  const [title, setTitle] = useState(initialTitle);
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done)
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-fmt-xls" aria-hidden />
        <h2 className="text-xl font-semibold">Request sent</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">An administrator will look for it. New files appear on Notera as soon as they’re added.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => { setDone(false); setTitle(""); setDetails(""); }}>Request another</Button>
          <Link href="/resources" className={buttonVariants()}>Browse resources</Link>
        </div>
      </div>
    );

  return (
    <form noValidate className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" onSubmit={(e) => {
      e.preventDefault();
      const payload = { ...locPayload(loc), title, details, category, contact, website };
      const parsed = requestSchema.safeParse(payload);
      if (!parsed.success) {
        const map: Record<string, string> = {};
        parsed.error.issues.forEach((i) => { map[String(i.path[0])] ||= i.message; });
        setErrors(map);
        return void toast.error(parsed.error.issues[0].message);
      }
      setErrors({});
      start(async () => {
        const res = await submitRequest(payload);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Request sent");
        setDone(true);
      });
    }}>
      <StudentCoursePicker departments={departments} courses={courses} loc={loc} onChange={setLoc} courseOptional
        error={errors.department_text ?? undefined} />
      <Field label="What are you looking for?" error={errors.title}>
        <Input value={title} maxLength={200} placeholder="e.g. Past exams for Data Structures" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Details (optional)" error={errors.details} hint="Lecturer, year, chapter, anything that helps us find the right file.">
        <Textarea value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type of file (optional)">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Contact (optional)" error={errors.contact} hint="Only administrators see this. Add it if you want to be told when it’s uploaded.">
          <Input value={contact} maxLength={120} placeholder="Telegram @name or email" onChange={(e) => setContact(e.target.value)} />
        </Field>
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send request"}</Button>
    </form>
  );
}
