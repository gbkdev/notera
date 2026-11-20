"use client";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { OTHER } from "@/lib/contribute";
import { emptyLoc, type Loc } from "@/lib/loc";
import type { CourseOption } from "@/components/admin/course-options";

/** Department → course, with an escape hatch when theirs isn’t in the catalogue yet. */
export function StudentCoursePicker({ departments, courses, loc, onChange, courseOptional = false, error }: {
  departments: { id: string; name: string }[]; courses: CourseOption[];
  loc: Loc; onChange: (next: Loc) => void; courseOptional?: boolean; error?: string;
}) {
  const inDept = courses.filter((c) => c.department_id === loc.deptSel);
  const showTyped = loc.deptSel === OTHER || loc.courseSel === OTHER;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Department">
        <Select value={loc.deptSel} onChange={(e) => onChange({ ...emptyLoc, deptSel: e.target.value })}>
          <option value="">Choose your department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          <option value={OTHER}>My department isn’t listed</option>
        </Select>
      </Field>

      {loc.deptSel && loc.deptSel !== OTHER && (
        <Field label={courseOptional ? "Course (optional)" : "Course"}>
          <Select value={loc.courseSel} onChange={(e) => onChange({ ...loc, courseSel: e.target.value, courseText: "" })}>
            <option value="">{courseOptional ? "Not sure / any course" : "Choose your course"}</option>
            {inDept.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name} · {c.year_label}, {c.semester_name}</option>)}
            <option value={OTHER}>My course isn’t listed</option>
          </Select>
        </Field>
      )}

      {loc.deptSel === OTHER && (
        <Field label="Department name"><Input value={loc.deptText} maxLength={120} onChange={(e) => onChange({ ...loc, deptText: e.target.value })} /></Field>
      )}
      {showTyped && (
        <Field label="Course name or code" error={error}>
          <Input value={loc.courseText} maxLength={160} placeholder="e.g. CS101 Introduction to Programming" onChange={(e) => onChange({ ...loc, courseText: e.target.value })} />
        </Field>
      )}
      {!showTyped && error && <p role="alert" className="text-xs text-destructive sm:col-span-2">{error}</p>}
    </div>
  );
}
