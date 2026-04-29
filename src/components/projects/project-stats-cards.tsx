"use client";

import { CheckCircle2Icon, CircleXIcon, Clock3Icon, HourglassIcon, LayoutGridIcon, PercentIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectWorkspaceState } from "@/lib/project-workspace";

type ProjectStatsCardsProps = {
  workspace: ProjectWorkspaceState;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function ProjectStatsCards({ workspace }: ProjectStatsCardsProps) {
  const stats: StatCard[] = [
    {
      title: "Total files",
      value: String(workspace.totalFiles),
      description: "Files attached to this project",
      icon: LayoutGridIcon,
    },
    {
      title: "Processed files",
      value: String(workspace.processedFiles),
      description: "Files completed in the workflow",
      icon: CheckCircle2Icon,
    },
    {
      title: "Failed files",
      value: String(workspace.failedFiles),
      description: "Files that need attention",
      icon: CircleXIcon,
    },
    {
      title: "Pending files",
      value: String(workspace.pendingFiles),
      description: "Files still waiting to be processed",
      icon: HourglassIcon,
    },
    {
      title: "Completion",
      value: `${workspace.completionPercent}%`,
      description: "Workflow progress across uploaded files",
      icon: PercentIcon,
    },
    {
      title: "Last run",
      value: workspace.lastRunDurationMs ? `${Math.max(1, Math.round(workspace.lastRunDurationMs / 1000))}s` : "—",
      description: workspace.lastRunDurationMs ? "Duration of the latest processing run" : "No completed run yet",
      icon: Clock3Icon,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.title} size="sm" className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-white/8 pb-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">{stat.title}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </div>
              <span className={cn("flex size-10 items-center justify-center rounded-[12px] border border-white/10 bg-secondary/70 text-primary") }>
                <Icon />
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-white">{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}