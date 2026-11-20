"use client";
import { useEffect, useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Opens the phone's share sheet (WhatsApp, Telegram…) when available, otherwise copies the link. */
export function ShareButton({ path, title, variant = "outline" }: { path: string; title: string; variant?: "outline" | "ghost" }) {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Copy the address from your browser instead.");
    }
  }

  return (
    <Button variant={variant} size="lg" onClick={async () => {
      const url = `${window.location.origin}${path}`;
      if (canShare) {
        try { await navigator.share({ title, url }); }
        catch (e) { if ((e as Error).name !== "AbortError") await copy(url); }
      } else await copy(url);
    }}>
      {canShare ? <Share2 className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
      {canShare ? "Share" : "Copy link"}
    </Button>
  );
}
