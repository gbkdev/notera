import type { Metadata } from "next";
import { SavedList } from "@/components/saved-list";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">Saved</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Files you bookmarked. They’re stored in this browser only, so clearing your browser data or switching devices removes them.</p>
      <div className="mt-8"><SavedList /></div>
    </div>
  );
}
