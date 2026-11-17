"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { CATEGORIES, FORMAT_GROUPS, SORTS } from "@/lib/constants";

type Props = {
  years?: { id: string; label: string }[];
  semesterNames?: string[];
  departments?: { id: string; name: string }[];
};

const KEYS = ["q", "category", "year", "semester", "ext", "dept", "sort"] as const;

/** Filters live in the URL, so every result page can be bookmarked and shared. */
export function ResourceFilters({ years, semesterNames, departments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }
  const active = KEYS.filter((k) => k !== "sort" && sp.get(k)).length > 0;
  const sel = (key: string, label: string, options: { value: string; label: string }[]) => (
    <Select aria-label={label} value={sp.get(key) ?? ""} onChange={(e) => update({ [key]: e.target.value })}>
      <option value="">{label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <form role="search" className="flex gap-2" onSubmit={(e) => { e.preventDefault(); update({ q: q.trim() }); }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" placeholder="Search title, course, department or keyword" className="pl-9" />
        </div>
        <Button type="submit">Search</Button>
      </form>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sel("category", "All categories", CATEGORIES.map((c) => ({ value: c.value, label: c.label })))}
        {sel("ext", "All formats", FORMAT_GROUPS.map((g) => ({ value: g.value, label: g.label })))}
        {departments && sel("dept", "All departments", departments.map((d) => ({ value: d.id, label: d.name })))}
        {years && sel("year", "All academic years", years.map((y) => ({ value: y.id, label: y.label })))}
        {semesterNames && sel("semester", "All semesters", semesterNames.map((s) => ({ value: s, label: s })))}
        {sel("sort", "Newest first", SORTS.map((s) => ({ value: s.value, label: s.label })).filter((s) => s.value !== "newest"))}
      </div>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => { setQ(""); router.push(pathname); }}>
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  );
}
