"use client";

import { useState } from "react";
import { CheckCircle2Icon, CopyIcon, DownloadIcon, FileTextIcon, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Streamdown } from "@/components/shared/Streamdown";
import { Clause46DraftPanel } from "@/components/projects/clause46-draft-panel";
import { PdfRedlineViewer } from "@/components/projects/pdf-redline-viewer";
import { ProjectWorkspaceState } from "@/lib/project-workspace";
import { getRossStreetControlCasePdfViolations } from "@/lib/pdf/violation-schema";

type ProjectReportTabProps = {
  workspace: ProjectWorkspaceState;
};


function Clause46NotTriggeredPanel({ clause46 }: { clause46: NonNullable<ProjectWorkspaceState["clause46"]> }) {
  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="border-b border-emerald-500/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-emerald-100">
          <CheckCircle2Icon data-icon="inline-start" />
          cl. 4.6 not triggered
        </CardTitle>
        <CardDescription>
          This project is configured as a no-hallucination control case. The variation drafter is hidden unless a development-standard breach is detected.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm leading-6 text-muted-foreground">{clause46.reason}</p>
        {clause46.source ? (
          <Badge variant="outline" className="mt-3">Source: {clause46.source}</Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ProjectReportTab({ workspace }: ProjectReportTabProps) {
  const [copied, setCopied] = useState(false);
  const primaryPlanFile = workspace.fileRows.find((file) => file.type === "SITE_PLAN")
    ?? workspace.fileRows.find((file) => file.type === "NOTIFICATION_PLANS")
    ?? workspace.fileRows[0]
    ?? null;
  const isRossStreetControlCase = workspace.masterView?.applicationNumber === "10.2026.00000172.001";
  const pdfViolations = isRossStreetControlCase
    ? getRossStreetControlCasePdfViolations(primaryPlanFile?.id)
    : undefined;

  const handleCopy = async () => {
    if (!workspace.reportMarkdown) {
      return;
    }

    await navigator.clipboard.writeText(workspace.reportMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!workspace.reportMarkdown || !workspace.reportMetadata) {
      return;
    }

    const blob = new Blob([workspace.reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-report-v${workspace.reportMetadata.version}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {workspace.hasReport && workspace.needsRerun ? (
        <Alert className="border-primary/20 bg-primary/8">
          <RefreshCwIcon />
          <AlertTitle>New files detected</AlertTitle>
          <AlertDescription>
            Re-run processing to refresh the report with the latest project documents.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon data-icon="inline-start" />
              Generated report
            </CardTitle>
            <CardDescription>
              Structured compliance output rendered from the latest generated report.
            </CardDescription>
          </div>

          {workspace.reportMetadata ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Version {workspace.reportMetadata.version}</Badge>
              <Badge variant="secondary">{workspace.reportMetadata.status}</Badge>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="grid gap-4 pt-4 xl:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Generated at</p>
              <p className="mt-2 text-sm font-medium text-white">{workspace.reportMetadata?.generatedAt ?? "—"}</p>
            </div>
            <div className="rounded-[16px] border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Source files</p>
              <p className="mt-2 text-sm font-medium text-white">{workspace.reportMetadata?.sourceFilesCount ?? 0}</p>
            </div>
            <div className="rounded-[16px] border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Current score</p>
              <p className="mt-2 text-sm font-medium text-white">{workspace.latestReport ? `${workspace.latestReport.score}/100` : "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button type="button" variant="outline" onClick={handleCopy} disabled={!workspace.reportMarkdown}>
              <CopyIcon data-icon="inline-start" />
              {copied ? "Copied" : "Copy markdown"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload} disabled={!workspace.reportMarkdown}>
              <DownloadIcon data-icon="inline-start" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <PdfRedlineViewer
        fileId={primaryPlanFile?.id}
        fileName={primaryPlanFile?.name}
        fileUrl={primaryPlanFile?.url}
        violations={pdfViolations}
      />

      {workspace.clause46?.triggered === false ? (
        <Clause46NotTriggeredPanel clause46={workspace.clause46} />
      ) : (
        <Clause46DraftPanel input={workspace.clause46?.input} />
      )}

      <Separator />

      <Streamdown
        loading={workspace.isProcessing && !workspace.hasReport}
        markdown={workspace.reportMarkdown}
        emptyTitle="Report not generated yet"
        emptyDescription="Start processing to produce the first compliance report for this project."
      />
    </div>
  );
}