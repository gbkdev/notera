import { FileQuestion } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <div className="py-24">
      <EmptyState icon={FileQuestion} title="We couldn't find that page"
        action={<LinkButton href="/resources">Browse all resources</LinkButton>}>
        The link may be old, or the resource may have been removed.
      </EmptyState>
    </div>
  );
}
