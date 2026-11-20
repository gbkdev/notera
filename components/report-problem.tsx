"use client";
import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { REPORT_REASONS } from "@/lib/constants";
import { submitReport } from "@/app/actions/report";

export function ReportProblem({ resourceId }: { resourceId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open)
    return <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setOpen(true)}><Flag className="h-4 w-4" /> Report a problem</Button>;

  return (
    <form className="space-y-3" noValidate onSubmit={(e) => {
      e.preventDefault();
      setError(null);
      start(async () => {
        const res = await submitReport({ resource_id: resourceId, reason, message, website });
        if (!res.ok) return void setError(res.error);
        toast.success("Thanks. An administrator will review it.");
        setOpen(false); setMessage("");
      });
    }}>
      <p className="text-sm font-semibold">Report a problem</p>
      <Field label="What’s wrong?">
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
          {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </Field>
      <Field label={reason === "other" ? "Details" : "Details (optional)"} error={error ?? undefined}>
        <Textarea value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} className="min-h-20" />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Sending…" : "Send report"}</Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
