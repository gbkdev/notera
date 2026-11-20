"use client";
import { useEffect, useState } from "react";
import { Bookmark, TriangleAlert } from "lucide-react";
import { useSaved } from "@/lib/use-saved";
import type { Resource } from "@/lib/types";
import { ResourceGrid } from "@/components/resource-card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";

export function SavedList() {
  const { ids, ready } = useSaved();
  const [items, setItems] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = ids.join(",");

  useEffect(() => {
    if (!ready || !key) return;
    const ctrl = new AbortController();
    setError(false);
    fetch(`/api/resources?ids=${key}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then((data: Resource[]) => setItems(data))
      .catch((e) => { if (e?.name !== "AbortError") setError(true); });
    return () => ctrl.abort();
  }, [ready, key, attempt]);

  if (!ready) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>;
  if (ids.length === 0)
    return (
      <EmptyState icon={Bookmark} title="Nothing saved yet" action={<LinkButton href="/resources">Browse resources</LinkButton>}>
        Tap the bookmark on any file to keep it here. Saved files stay on this device only.
      </EmptyState>
    );
  if (error)
    return (
      <EmptyState icon={TriangleAlert} title="Couldn’t load your saved files" action={<Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}>
        Check your connection and try again. Your saved list is safe.
      </EmptyState>
    );
  if (items === null) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ids.slice(0, 3).map((i) => <Skeleton key={i} className="h-44" />)}</div>;

  const visible = items.filter((r) => ids.includes(r.id)); // unsaving removes a card immediately
  if (visible.length === 0)
    return <EmptyState icon={Bookmark} title="Those files are no longer available">They may have been removed. Saved items that still exist will appear here.</EmptyState>;
  return <ResourceGrid resources={visible} />;
}
