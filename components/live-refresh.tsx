"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Status = "connecting" | "live" | "offline";

/**
 * Listens for database changes and re-renders the current page's data in place (no full reload, and
 * anything the visitor typed is kept). Changes are batched, and held back while the tab is hidden.
 */
export function LiveRefresh({ tables, minGap = 3000, indicator = false }: { tables: string[]; minGap?: number; indicator?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");
  const key = tables.join(",");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastRun = useRef(0);
  const missed = useRef(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const run = () => { missed.current = false; lastRun.current = Date.now(); router.refresh(); };
    const schedule = () => {
      if (document.visibilityState === "hidden") { missed.current = true; return; }
      clearTimeout(timer.current);
      timer.current = setTimeout(run, Math.max(400, minGap - (Date.now() - lastRun.current)));
    };

    const channel = supabase.channel(`live-${key}`);
    key.split(",").forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule));
    channel.subscribe((s) => setStatus(s === "SUBSCRIBED" ? "live" : s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "offline" : "connecting"));

    const onVisible = () => { if (document.visibilityState === "visible" && missed.current) schedule(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [key, minGap, router]);

  if (!indicator) return null;
  return (
    <span role="status" className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", status === "live" ? "bg-fmt-xls" : status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
      {status === "live" ? "Live updates on" : status === "offline" ? "Live updates off" : "Connecting…"}
    </span>
  );
}
