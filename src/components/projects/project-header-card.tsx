"use client";

import { CalendarDaysIcon, Clock3Icon, FileTextIcon, Loader2Icon, PlayIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";

import { ProjectStrict } from "@models/data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/projects/status-badge";
import { cn } from "@/lib/utils";
import { ProjectWorkspaceState } from "@/lib/project-workspace";

type ProjectHeaderCardProps = {
  project: ProjectStrict;
  workspace: ProjectWorkspaceState;
  onProcess: () => void;
  processDisabled: boolean;
};

function formatDate(value: Date): string {
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStage(stage: string): string {
  return stage
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ProjectHeaderCard({ project, workspace, onProcess, processDisabled }: ProjectHeaderCardProps) {
  return (
    <Card className="sticky top-4 z-20 border-white/12 bg-card/96 backdrop-blur-xl">
      <CardHeader className="gap-4 border-b border-white/8 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <SparklesIcon data-icon="inline-start" />
                Project workspace
              </Badge>
              <StatusBadge status={workspace.status} />
              <Badge variant="outline" className="gap-1.5">
                Stage: {formatStage(workspace.stage)}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl md:text-3xl">{project.name}</CardTitle>
              <CardDescription className="max-w-3xl text-sm md:text-base">
                {project.description ?? project.address}
              </CardDescription>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-[18px] border border-white/8 bg-secondary/45 p-4">
            <Button
              type="button"
              onClick={onProcess}
              disabled={processDisabled}
              className="min-w-48 justify-center"
            >
              {workspace.isProcessing ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : workspace.hasReport ? (
                <RefreshCwIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {workspace.processingActionLabel}
            </Button>
            <p className={cn("text-xs text-muted-foreground", processDisabled && "text-white/50")}>{workspace.processingActionHint}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[16px] border border-white/8 bg-secondary/40 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-white/62">
            <CalendarDaysIcon data-icon="inline-start" />
            Created
          </p>
          <p className="mt-2 text-sm font-medium text-white">{formatDate(project.createdAt)}</p>
        </div>
        <div className="rounded-[16px] border border-white/8 bg-secondary/40 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-white/62">
            <Clock3Icon data-icon="inline-start" />
            Updated
          </p>
          <p className="mt-2 text-sm font-medium text-white">{formatDate(project.updatedAt)}</p>
        </div>
        <div className="rounded-[16px] border border-white/8 bg-secondary/40 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-white/62">
            <FileTextIcon data-icon="inline-start" />
            Files
          </p>
          <p className="mt-2 text-sm font-medium text-white">{workspace.totalFiles} documents</p>
        </div>
        <div className="rounded-[16px] border border-white/8 bg-secondary/40 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/62">Completion</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={workspace.completionPercent} className="flex-1" />
            <span className="text-sm font-semibold tabular-nums text-white">{workspace.completionPercent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}