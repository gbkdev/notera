"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFeatured } from "@/app/actions/admin";
import type { ActionResult } from "@/lib/types";

/** Two-step delete: the first click asks, the second click deletes. */
export function DeleteButton({ action, label }: { action: () => Promise<ActionResult>; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  if (!confirming)
    return <Button variant="ghost" size="sm" aria-label={`Delete ${label}`} onClick={() => setConfirming(true)}><Trash2 className="h-4 w-4" /></Button>;
  return (
    <span className="inline-flex gap-1">
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => {
        const res = await action();
        if (res.ok) { toast.success("Deleted"); router.refresh(); } else toast.error(res.error);
        setConfirming(false);
      })}>{pending ? "Deleting…" : "Confirm delete"}</Button>
      <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
    </span>
  );
}

export function FeatureToggle({ id, featured }: { id: string; featured: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} aria-pressed={featured}
      aria-label={featured ? "Remove from featured" : "Mark as featured"}
      onClick={() => start(async () => {
        const res = await setFeatured(id, !featured);
        if (res.ok) { toast.success(featured ? "Removed from featured" : "Marked as featured"); router.refresh(); } else toast.error(res.error);
      })}>
      <Star className={featured ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
    </Button>
  );
}
