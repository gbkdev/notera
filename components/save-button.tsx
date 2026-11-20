"use client";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SAVED_LIMIT, useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

export function SaveButton({ id, labeled = false }: { id: string; labeled?: boolean }) {
  const { has, toggle } = useSaved();
  const saved = has(id);
  return (
    <Button
      variant={labeled ? "outline" : "ghost"} size={labeled ? "lg" : "icon"}
      className={cn(!labeled && "ml-auto h-8 w-8")}
      aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save for later"}
      onClick={() => {
        const result = toggle(id);
        if (result === "added") toast.success("Saved on this device");
        else if (result === "removed") toast("Removed from saved");
        else if (result === "full") toast.error(`You can save up to ${SAVED_LIMIT} files. Remove one first.`);
        else toast.error("Your browser is blocking saved items (private mode?).");
      }}>
      <Bookmark className={cn(labeled ? "h-5 w-5" : "h-4 w-4", saved && "fill-current")} />
      {labeled && (saved ? "Saved" : "Save")}
    </Button>
  );
}
