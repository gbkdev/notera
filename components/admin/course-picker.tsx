"use client";
import { useMemo, useState } from "react";
import { Field, Select } from "@/components/ui/form-controls";
import type { CourseOption } from "@/components/admin/course-options";

const uniq = <T extends { id: string }>(xs: T[]) => Array.from(new Map(xs.map((x) => [x.id, x])).values());

/** Department → year → semester → course. Each step only offers what exists under the previous choice. */
export function CoursePicker({ courses, value, onChange, error }: {
  courses: CourseOption[]; value: string; onChange: (courseId: string) => void; error?: string;
}) {
  const start = courses.find((c) => c.id === value);
  const [dept, setDept] = useState(start?.department_id ?? "");
  const [year, setYear] = useState(start?.year_id ?? "");
  const [sem, setSem] = useState(start?.semester_id ?? "");

  const depts = useMemo(() => uniq(courses.map((c) => ({ id: c.department_id, label: c.department_name }))), [courses]);
  const years = useMemo(() => uniq(courses.filter((c) => c.department_id === dept).map((c) => ({ id: c.year_id, label: c.year_label }))), [courses, dept]);
  const sems = useMemo(() => uniq(courses.filter((c) => c.department_id === dept && c.year_id === year).map((c) => ({ id: c.semester_id, label: c.semester_name }))), [courses, dept, year]);
  const opts = useMemo(() => courses.filter((c) => c.department_id === dept && c.year_id === year && c.semester_id === sem), [courses, dept, year, sem]);

  return (
    <>
      <Field label="Department">
        <Select value={dept} onChange={(e) => { setDept(e.target.value); setYear(""); setSem(""); onChange(""); }}>
          <option value="">Choose a department</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Academic year">
        <Select value={year} disabled={!dept} onChange={(e) => { setYear(e.target.value); setSem(""); onChange(""); }}>
          <option value="">Choose a year</option>{years.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Semester">
        <Select value={sem} disabled={!year} onChange={(e) => { setSem(e.target.value); onChange(""); }}>
          <option value="">Choose a semester</option>{sems.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Course" error={error}>
        <Select value={value} disabled={!sem} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose a course</option>{opts.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
        </Select>
      </Field>
    </>
  );
}
