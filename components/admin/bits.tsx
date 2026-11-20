"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFeatured, setReportStatus } from "@/app/actions/admin";
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
  const [on, setOn] = useState(featured);
  const [pending, start] = useTransition();
  useEffect(() => setOn(featured), [featured]);
  return (
    <Button variant="ghost" size="sm" disabled={pending} aria-pressed={on}
      aria-label={on ? "Remove from the homepage" : "Feature on the homepage"} title={on ? "Featured on the homepage. Click to remove" : "Click to feature on the homepage"}
      onClick={() => {
        const next = !on;
        setOn(next); // flips instantly; rolls back if the server says no
        start(async () => {
          const res = await setFeatured(id, next);
          if (res.ok) { toast.success(next ? "Added to the homepage" : "Removed from the homepage"); router.refresh(); }
          else { setOn(!next); toast.error(res.error); }
        });
      }}>
      <Star className={on ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
    </Button>
  );
}

export function ReportStatusButton({ id, status }: { id: string; status: "open" | "resolved" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = status === "open" ? "resolved" : "open";
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => {
      const res = await setReportStatus(id, next);
      if (res.ok) { toast.success(next === "resolved" ? "Marked as resolved" : "Reopened"); router.refresh(); } else toast.error(res.error);
    })}>{status === "open" ? "Mark resolved" : "Reopen"}</Button>
  );
}
