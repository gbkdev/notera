"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({ initial = "", large = false }: { initial?: string; large?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form role="search" className="flex w-full gap-2" onSubmit={(e) => {
      e.preventDefault();
      router.push(q.trim() ? `/resources?q=${encodeURIComponent(q.trim())}` : "/resources");
    }}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources"
          placeholder="Search by file, course, department or keyword"
          className={`w-full rounded-lg border border-input bg-card pl-12 pr-4 placeholder:text-muted-foreground ${large ? "h-14 text-base" : "h-11 text-sm"}`}
        />
      </div>
      <Button type="submit" size={large ? "lg" : "md"}>Search</Button>
    </form>
  );
}
