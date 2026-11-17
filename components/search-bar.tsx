"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BookMarked, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = { type: "course" | "resource"; label: string; sub: string; href: string };

export function SearchBar({ initial = "", large = false }: { initial?: string; large?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  // Debounced lookup against the real database.
  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (res.ok) { setItems(await res.json()); setActive(-1); }
      } catch { /* aborted or offline: keep the plain search working */ }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const showList = open && items.length > 0;
  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <form role="search" className="flex w-full gap-2" onSubmit={(e) => {
      e.preventDefault();
      if (active >= 0 && items[active]) return go(items[active].href);
      go(q.trim() ? `/resources?q=${encodeURIComponent(q.trim())}` : "/resources");
    }}>
      <div ref={box} className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && showList) { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
            else if (e.key === "ArrowUp" && showList) { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
            else if (e.key === "Escape") setOpen(false);
          }}
          aria-label="Search resources" autoComplete="off"
          placeholder="Search by file, course, department or keyword"
          className={`w-full rounded-lg border border-input bg-card pl-12 pr-4 placeholder:text-muted-foreground ${large ? "h-14 text-base" : "h-11 text-sm"}`}
        />
        {showList && (
          <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border bg-card shadow-lg">
            {items.map((s, i) => (
              <li key={`${s.href}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(s.href)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted ${i === active ? "bg-muted" : ""}`}>
                  {s.type === "course" ? <BookMarked className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className="min-w-0 flex-1 truncate font-medium">{s.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button type="submit" size={large ? "lg" : "md"}>Search</Button>
    </form>
  );
}
