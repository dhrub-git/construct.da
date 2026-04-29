"use client";

import { AlertTriangleIcon, ExternalLinkIcon, FileTextIcon, InfoIcon, ShieldAlertIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pdfUserSpaceToCssPercentRect } from "@/lib/pdf/coordinates";
import {
  getFixturePdfViolations,
  getPdfViolationsForPage,
  PDF_FIXTURE_PAGE,
  type PdfViolationBox,
  type ViolationSeverity,
} from "@/lib/pdf/violation-schema";

type PdfRedlineViewerProps = {
  fileId?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  violations?: PdfViolationBox[];
  page?: number;
};

const severityStyles: Record<ViolationSeverity, { box: string; badge: "default" | "secondary" | "destructive" | "outline"; icon: typeof AlertTriangleIcon }> = {
  error: {
    box: "border-red-400 bg-red-500/20 shadow-[0_0_0_1px_rgba(248,113,113,0.45),0_0_24px_rgba(248,113,113,0.28)]",
    badge: "destructive",
    icon: ShieldAlertIcon,
  },
  warning: {
    box: "border-amber-300 bg-amber-400/20 shadow-[0_0_0_1px_rgba(252,211,77,0.35),0_0_20px_rgba(252,211,77,0.2)]",
    badge: "secondary",
    icon: AlertTriangleIcon,
  },
  info: {
    box: "border-sky-300 bg-sky-400/18 shadow-[0_0_0_1px_rgba(125,211,252,0.3),0_0_18px_rgba(125,211,252,0.16)]",
    badge: "outline",
    icon: InfoIcon,
  },
};

export function PdfRedlineViewer({
  fileId,
  fileName,
  fileUrl,
  violations,
  page = PDF_FIXTURE_PAGE.page,
}: PdfRedlineViewerProps) {
  const boundViolations = violations ?? getFixturePdfViolations(fileId ?? undefined);
  const pageViolations = getPdfViolationsForPage(boundViolations, page);
  const hasPdf = Boolean(fileUrl);

  return (
    <Card className="overflow-hidden border-red-500/20 bg-card/95">
      <CardHeader className="flex flex-col gap-4 border-b border-border lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon data-icon="inline-start" />
            PDF red-line review
          </CardTitle>
          <CardDescription>
            Deterministic plan-sheet issue boxes are mapped from PDF user-space coordinates so extraction can safely fall back to fixtures.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Page {page}</Badge>
          <Badge variant={hasPdf ? "default" : "secondary"}>{hasPdf ? "Uploaded PDF" : "Fixture preview"}</Badge>
          <Badge variant="destructive">{pageViolations.length} red-lines</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-5">
        <div className="rounded-[24px] border border-border bg-secondary/35 p-3 shadow-inner">
          <div
            className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[18px] border border-border bg-[#f8f5ef] shadow-2xl"
            style={{ aspectRatio: `${PDF_FIXTURE_PAGE.width} / ${PDF_FIXTURE_PAGE.height}` }}
          >
            {hasPdf ? (
              <iframe
                title={`${fileName ?? "Uploaded PDF"} preview`}
                src={`${fileUrl}#page=${page}&toolbar=0&navpanes=0`}
                className="absolute inset-0 size-full border-0 bg-white"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,rgba(15,23,42,0.05)_25%,transparent_25%),linear-gradient(225deg,rgba(15,23,42,0.05)_25%,transparent_25%),linear-gradient(45deg,rgba(15,23,42,0.05)_25%,transparent_25%),linear-gradient(315deg,rgba(15,23,42,0.05)_25%,#f8f5ef_25%)] bg-[length:32px_32px] bg-[position:16px_0,16px_0,0_0,0_0] p-8 text-center text-slate-900">
                <FileTextIcon className="size-10 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">PDF source unavailable</p>
                  <p className="mt-2 max-w-sm text-sm text-slate-600">
                    The viewer is showing the fixture plan sheet until an uploaded public PDF URL is available.
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-white/10" aria-hidden="true" />

            {pageViolations.map((violation, index) => {
              const rect = pdfUserSpaceToCssPercentRect(violation, PDF_FIXTURE_PAGE);
              const style = severityStyles[violation.severity];

              return (
                <div
                  key={violation.id}
                  className={cn(
                    "pointer-events-auto absolute rounded-md border-2 backdrop-blur-[1px] transition-transform hover:scale-[1.02]",
                    style.box,
                  )}
                  style={rect}
                  aria-label={`${violation.title}: ${violation.message}`}
                  title={`${violation.rule}: ${violation.message}`}
                >
                  <span className="absolute -left-2 -top-2 grid size-6 place-items-center rounded-full border border-white/70 bg-slate-950 text-[11px] font-semibold text-white shadow-lg">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {hasPdf ? (
            <a
              href={fileUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Open source PDF in a new tab
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </div>

        <aside className="rounded-[24px] border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Issue rail</p>
              <p className="text-xs text-muted-foreground">Fixture-backed findings for legal review.</p>
            </div>
            <Badge variant="outline">{fileName ?? "site-plan.pdf"}</Badge>
          </div>

          <ol className="mt-4 flex flex-col gap-3">
            {pageViolations.map((violation, index) => {
              const style = severityStyles[violation.severity];
              const Icon = style.icon;

              return (
                <li key={violation.id} className="rounded-[18px] border border-border bg-background/60 p-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={style.badge} className="gap-1">
                          <Icon className="size-3" />
                          {violation.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{violation.rule}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{violation.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{violation.message}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </CardContent>
    </Card>
  );
}
