"use client";
import { useEffect, useState } from "react";
import { Download, Eye, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/misc";
import { Button, buttonVariants } from "@/components/ui/button";

type Mode = "deciding" | "auto" | "tap";

/**
 * Embedded viewer. On Data Saver or a slow connection it waits for a tap instead of loading the
 * whole document in the background, and it falls back to a download if the frame never finishes.
 */
export function DocumentPreview({ src, title, downloadHref, openHref, office, sizeLabel }: {
  src: string; title: string; downloadHref: string; openHref: string; office: boolean; sizeLabel: string;
}) {
  const [mode, setMode] = useState<Mode>("deciding");
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    setMode(c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? "") ? "tap" : "auto");
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const t = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(t);
  }, [mode]);

  if (mode === "tap")
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
        <Eye className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">Preview paused to save data</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Your connection is slow or Data Saver is on. Loading the preview uses up to {sizeLabel}.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => setMode("auto")}><Eye className="h-4 w-4" /> Load preview</Button>
          <a href={downloadHref} className={buttonVariants({ variant: "outline" })}><Download className="h-4 w-4" /> Download instead</a>
        </div>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="relative h-[75vh] min-h-[480px]">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        {mode === "auto" && (
          <iframe src={src} title={`Preview of ${title}`} onLoad={() => setLoaded(true)} className="absolute inset-0 h-full w-full" />
        )}
        <noscript><p className="p-6 text-sm">Turn on JavaScript to preview this file, or download it instead.</p></noscript>
      </div>
      {!loaded && slow && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-t bg-muted p-3 text-sm">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">The preview is taking too long. You can still download the file.</span>
          <a href={downloadHref} className={buttonVariants({ size: "sm" })}><Download className="h-4 w-4" /> Download</a>
        </div>
      )}
      <p className="border-t p-3 text-xs text-muted-foreground">
        {office ? "Previews of Office files are rendered by Microsoft’s online viewer. " : ""}
        Not showing? <a className="text-primary underline" href={openHref} target="_blank" rel="noopener noreferrer">Open the file in a new tab</a> or download it.
      </p>
    </div>
  );
}
