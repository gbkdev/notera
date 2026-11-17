"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24">
      <EmptyState icon={TriangleAlert} title="This page didn't load"
        action={<Button onClick={reset}>Try again</Button>}>
        The library couldn't be reached. Check your connection and try again.
      </EmptyState>
    </div>
  );
}
