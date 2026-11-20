"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CATEGORIES } from "@/lib/constants";
import { approveSubmission, rejectSubmission, setRequestStatus } from "@/app/actions/review";
import { CoursePicker } from "@/components/admin/course-picker";
import type { CourseOption } from "@/components/admin/course-options";

export function RequestStatusButtons({ id, status }: { id: string; status: "open" | "fulfilled" | "dismissed" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: "open" | "fulfilled" | "dismissed", msg: string) => start(async () => {
    const res = await setRequestStatus(id, next);
    if (res.ok) { toast.success(msg); router.refresh(); } else toast.error(res.error);
  });
  return status === "open" ? (
    <>
      <Button size="sm" disabled={pending} onClick={() => set("fulfilled", "Marked as fulfilled")}>Fulfilled</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => set("dismissed", "Dismissed")}>Dismiss</Button>
    </>
  ) : (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => set("open", "Reopened")}>Reopen</Button>
  );
}

/** Edit the details, choose the course, then publish the student's file or reject it. */
export function SubmissionReview({ id, courses, initial }: {
  id: string; courses: CourseOption[];
  initial: { course_id: string; title: string; description: string; category: string };
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(initial.course_id);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [confirmReject, setConfirmReject] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CoursePicker courses={courses} value={courseId} onChange={setCourseId} error={undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title"><Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Description"><Textarea value={description} maxLength={500} className="min-h-16" onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || !courseId || title.trim().length < 2} onClick={() => start(async () => {
          const res = await approveSubmission(id, { course_id: courseId, title, description, category });
          if (res.ok) { toast.success("Published"); router.refresh(); } else toast.error(res.error);
        })}>{pending ? "Working…" : "Approve and publish"}</Button>
        {!confirmReject ? (
          <Button variant="outline" disabled={pending} onClick={() => setConfirmReject(true)}>Reject</Button>
        ) : (
          <>
            <Button variant="destructive" disabled={pending} onClick={() => start(async () => {
              const res = await rejectSubmission(id);
              if (res.ok) { toast.success("Rejected and file deleted"); router.refresh(); } else toast.error(res.error);
              setConfirmReject(false);
            })}>Confirm reject (deletes the file)</Button>
            <Button variant="ghost" onClick={() => setConfirmReject(false)}>Cancel</Button>
          </>
        )}
      </div>
      {!courseId && <p className="text-xs text-muted-foreground">Choose a course to publish this file. If the student’s course isn’t in the catalogue yet, add it under Courses first.</p>}
    </div>
  );
}
