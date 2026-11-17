"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Download, FileJson, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { importCatalog } from "@/app/actions/import";
import { TEMPLATE, type ImportResult, type Summary } from "@/lib/catalog-import";

const LABELS: Record<keyof Summary, string> = {
  departments: "Departments", academic_years: "Academic years", semesters: "Semesters", courses: "Courses",
};

export function ImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<string | null>(null); // the exact text that passed the check
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  function run(dryRun: boolean) {
    start(async () => {
      const res = await importCatalog(text, dryRun);
      setResult(res);
      if (!res.ok) { setChecked(null); return void toast.error("Fix the problems listed below"); }
      if (dryRun) { setChecked(text); toast.success("File looks good"); }
      else { setChecked(null); toast.success("Import complete"); router.refresh(); }
    });
  }

  function download() {
    const blob = new Blob([JSON.stringify(TEMPLATE, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "notera-import-template.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const canImport = checked !== null && checked === text && !pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium hover:bg-muted">
          <FileJson className="h-4 w-4" aria-hidden /> Choose .json file
          <input type="file" accept=".json,application/json" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!f.name.toLowerCase().endsWith(".json")) return void toast.error("Choose a .json file.");
            if (f.size > 1_000_000) return void toast.error("That file is over 1 MB.");
            setText(await f.text()); setResult(null); setChecked(null);
          }} />
        </label>
        <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> Download template</Button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">JSON</span>
        <Textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null); setChecked(null); }}
          spellCheck={false} className="min-h-72 font-mono text-xs" placeholder='{ "departments": [], "academic_years": [], "courses": [] }' />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending || !text.trim()} onClick={() => run(true)}>{pending && !canImport ? "Checking…" : "Check file"}</Button>
        <Button disabled={!canImport} onClick={() => run(false)}>{pending && canImport ? "Importing…" : "Import"}</Button>
      </div>
      {!canImport && text.trim() && <p className="text-xs text-muted-foreground">Check the file first. Import unlocks when it passes.</p>}

      {result && !result.ok && (
        <div role="alert" className="rounded-lg border border-destructive/50 bg-card p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold text-destructive"><TriangleAlert className="h-4 w-4" aria-hidden /> Nothing was imported</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {result?.ok && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-fmt-xls" aria-hidden />
            {result.dryRun ? "This is what the import will do" : "Imported"}</p>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">{result.dryRun ? "Will add" : "Added"}</th><th className="pb-2 font-medium">Already exist (skipped)</th></tr></thead>
            <tbody>
              {(Object.keys(LABELS) as (keyof Summary)[]).map((k) => (
                <tr key={k} className="border-t"><td className="py-2">{LABELS[k]}</td><td className="py-2 font-medium">{result.summary[k].create}</td><td className="py-2 text-muted-foreground">{result.summary[k].skip}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
