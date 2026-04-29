"use client";

import { useMemo, useState } from "react";
import { AlertTriangleIcon, ClipboardCheckIcon, CopyIcon, DownloadIcon, FilePenLineIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildClause46Draft,
  buildClause46DraftFileName,
  DEFAULT_CLAUSE_46_DRAFT_INPUT,
  type Clause46DraftInput,
} from "@/lib/drafter/clause46";

export type Clause46DraftPanelProps = {
  input?: Clause46DraftInput;
};

export function Clause46DraftPanel({ input = DEFAULT_CLAUSE_46_DRAFT_INPUT }: Clause46DraftPanelProps) {
  const [copied, setCopied] = useState(false);
  const draft = useMemo(() => buildClause46Draft(input), [input]);
  const downloadFileName = useMemo(() => buildClause46DraftFileName(input), [input]);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(draft.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([draft.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="flex items-center gap-2">
            <FilePenLineIcon data-icon="inline-start" />
            cl. 4.6 draft request
          </CardTitle>
          <CardDescription>
            Deterministic markdown draft for a NSW development standard variation request.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={draft.lppRequired ? "destructive" : "secondary"}>
            {draft.lppRequired ? "LPP flag: &gt;10%" : "Under LPP threshold"}
          </Badge>
          <Badge variant="outline">Markdown export</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-4">
          {draft.lppRequired ? (
            <div className="flex gap-3 rounded-[16px] border border-destructive/25 bg-destructive/10 p-4 text-sm text-foreground">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p>
                The proposed variation is greater than 10%, so this draft flags likely Local Planning Panel review before determination.
              </p>
            </div>
          ) : null}

          <div className="rounded-[16px] border border-border bg-secondary/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Section order</p>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-4 text-sm text-muted-foreground">
              {draft.sections.map((section) => (
                <li key={section.heading}>{section.heading.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? <ClipboardCheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {copied ? "Copied" : "Copy markdown"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload}>
              <DownloadIcon data-icon="inline-start" />
              Download .md
            </Button>
          </div>
        </div>

        <div className="min-w-0 rounded-[16px] border border-border bg-background/70">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{draft.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{downloadFileName}</p>
          </div>
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-muted-foreground">
            {draft.markdown}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
