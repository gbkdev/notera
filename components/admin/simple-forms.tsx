"use client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { DEPARTMENT_ICONS } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import {
  courseSchema, departmentSchema, semesterSchema, yearSchema,
  type CourseValues, type DepartmentValues, type SemesterValues, type YearValues,
} from "@/lib/validation";
import { saveCourse, saveDepartment, saveSemester, saveYear } from "@/app/actions/admin";
import type { ActionResult } from "@/lib/types";

function useSubmit(editing: boolean, cancelHref: string, noun: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function submit(run: () => Promise<ActionResult>, reset: () => void) {
    start(async () => {
      const res = await run();
      if (!res.ok) return void toast.error(res.error);
      toast.success(editing ? `${noun} updated` : `${noun} added`);
      if (editing) router.push(cancelHref); else reset();
      router.refresh();
    });
  }
  return { pending, submit };
}

function Actions({ editing, pending, cancelHref, noun }: { editing: boolean; pending: boolean; cancelHref: string; noun: string }) {
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : `Add ${noun.toLowerCase()}`}</Button>
      {editing && <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>Cancel</Link>}
    </div>
  );
}

export function DepartmentForm({ initial, id }: { initial?: DepartmentValues; id?: string }) {
  const href = "/admin/departments";
  const { pending, submit } = useSubmit(!!id, href, "Department");
  const form = useForm<DepartmentValues>({ resolver: zodResolver(departmentSchema), defaultValues: initial ?? { name: "", slug: "", description: "", icon: "graduation-cap" } });
  const { register, handleSubmit, setValue, formState: { errors, dirtyFields } } = form;
  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => submit(() => saveDepartment(v, id), () => form.reset({ name: "", slug: "", description: "", icon: "graduation-cap" })))}>
      <Field label="Name" error={errors.name?.message}>
        <Input {...register("name", { onChange: (e) => { if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value)); } })} />
      </Field>
      <Field label="URL name" error={errors.slug?.message} hint="Used in the page address, e.g. computer-science"><Input {...register("slug")} /></Field>
      <Field label="Icon" error={errors.icon?.message}>
        <Select {...register("icon")}>{Object.entries(DEPARTMENT_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
      </Field>
      <div className="sm:col-span-2"><Field label="Description" error={errors.description?.message}><Textarea {...register("description")} /></Field></div>
      <div className="sm:col-span-2"><Actions editing={!!id} pending={pending} cancelHref={href} noun="Department" /></div>
    </form>
  );
}

export function YearForm({ initial, id }: { initial?: YearValues; id?: string }) {
  const href = "/admin/terms";
  const { pending, submit } = useSubmit(!!id, href, "Academic year");
  const form = useForm<YearValues>({ resolver: zodResolver(yearSchema), defaultValues: initial ?? { label: "", sort_order: 0 } });
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => submit(() => saveYear(v, id), () => form.reset({ label: "", sort_order: 0 })))}>
      <Field label="Label" error={errors.label?.message}><Input placeholder="Year 1" {...register("label")} /></Field>
      <Field label="Order" error={errors.sort_order?.message} hint="Lower numbers appear first"><Input type="number" {...register("sort_order", { valueAsNumber: true })} /></Field>
      <div className="sm:col-span-2"><Actions editing={!!id} pending={pending} cancelHref={href} noun="Academic year" /></div>
    </form>
  );
}

export function SemesterForm({ years, initial, id }: { years: { id: string; label: string }[]; initial?: SemesterValues; id?: string }) {
  const href = "/admin/terms";
  const { pending, submit } = useSubmit(!!id, href, "Semester");
  const empty = { academic_year_id: "", name: "", sort_order: 0 };
  const form = useForm<SemesterValues>({ resolver: zodResolver(semesterSchema), defaultValues: initial ?? empty });
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form noValidate className="grid gap-4 sm:grid-cols-3" onSubmit={handleSubmit((v) => submit(() => saveSemester(v, id), () => form.reset(empty)))}>
      <Field label="Academic year" error={errors.academic_year_id?.message}>
        <Select {...register("academic_year_id")}><option value="">Choose a year</option>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</Select>
      </Field>
      <Field label="Name" error={errors.name?.message}><Input placeholder="Semester 1" {...register("name")} /></Field>
      <Field label="Order" error={errors.sort_order?.message}><Input type="number" {...register("sort_order", { valueAsNumber: true })} /></Field>
      <div className="sm:col-span-3"><Actions editing={!!id} pending={pending} cancelHref={href} noun="Semester" /></div>
    </form>
  );
}

export function CourseForm({ departments, semesters, initial, id }: {
  departments: { id: string; name: string }[];
  semesters: { id: string; label: string }[];
  initial?: CourseValues; id?: string;
}) {
  const href = "/admin/courses";
  const { pending, submit } = useSubmit(!!id, href, "Course");
  const empty = { department_id: "", semester_id: "", code: "", name: "", description: "" };
  const form = useForm<CourseValues>({ resolver: zodResolver(courseSchema), defaultValues: initial ?? empty });
  const { register, handleSubmit, formState: { errors } } = form;
  useEffect(() => { if (initial) form.reset(initial); }, [initial, form]);
  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => submit(() => saveCourse(v, id), () => form.reset(empty)))}>
      <Field label="Department" error={errors.department_id?.message}>
        <Select {...register("department_id")}><option value="">Choose a department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
      </Field>
      <Field label="Year and semester" error={errors.semester_id?.message}>
        <Select {...register("semester_id")}><option value="">Choose a semester</option>{semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
      </Field>
      <Field label="Course code" error={errors.code?.message}><Input placeholder="CS101" {...register("code")} /></Field>
      <Field label="Course name" error={errors.name?.message}><Input {...register("name")} /></Field>
      <div className="sm:col-span-2"><Field label="Description (optional)" error={errors.description?.message}><Textarea {...register("description")} /></Field></div>
      <div className="sm:col-span-2"><Actions editing={!!id} pending={pending} cancelHref={href} noun="Course" /></div>
    </form>
  );
}
