import { GraduationCap } from "lucide-react";
import { DEPARTMENT_ICONS } from "@/lib/constants";

export function DeptIcon({ name, className }: { name: string; className?: string }) {
  const Icon = DEPARTMENT_ICONS[name]?.Icon ?? GraduationCap;
  return <Icon className={className} aria-hidden />;
}
