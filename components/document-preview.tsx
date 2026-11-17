"use client";
import { useEffect, useState } from "react";
import { Download, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

/** Embedded viewer with a loading skeleton and a fallback if the frame never finishes loading. */
export function DocumentPreview({ src, title, downloadHref, openHref, office }: {
  src: string; title: string; downloadHref: string; openHref: string; office: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="relative h-[75vh] min-h-[480px]">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <iframe src={src} title={`Preview of ${title}`} onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full" />
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
