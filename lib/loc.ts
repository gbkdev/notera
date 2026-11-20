import { OTHER } from "@/lib/contribute";
import { UUID_RE } from "@/lib/utils";

/** Where a student says their file or request belongs. Shared by server and client code. */
export type Loc = { deptSel: string; courseSel: string; deptText: string; courseText: string };
export const emptyLoc: Loc = { deptSel: "", courseSel: "", deptText: "", courseText: "" };

/** Turns the picker state into the fields the server expects. */
export function locPayload(l: Loc) {
  const deptId = UUID_RE.test(l.deptSel) ? l.deptSel : "";
  const courseId = deptId && UUID_RE.test(l.courseSel) ? l.courseSel : "";
  const typedCourse = l.deptSel === OTHER || l.courseSel === OTHER;
  return {
    department_id: deptId,
    department_text: deptId ? "" : l.deptSel === OTHER ? l.deptText.trim() : "",
    course_id: courseId,
    course_text: courseId ? "" : typedCourse ? l.courseText.trim() : "",
  };
}
