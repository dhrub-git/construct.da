"use client";

import { ActivityIcon, AlertTriangleIcon, FileUpIcon, ShieldAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProjectWorkspaceState } from "@/lib/project-workspace";
import { ProjectStatsCards } from "@/components/projects/project-stats-cards";
import { ProjectWorkflowTimeline } from "@/components/projects/project-workflow-timeline";

type ProjectOverviewTabProps = {
  workspace: ProjectWorkspaceState;
};

function activityIcon(tone: ProjectWorkspaceState["recentActivity"][number]["tone"]) {
  switch (tone) {
    case "warning":
      return AlertTriangleIcon;
    case "destructive":
      return ShieldAlertIcon;
    case "muted":
      return FileUpIcon;
    default:
      return ActivityIcon;
  }
}

export function ProjectOverviewTab({ workspace }: ProjectOverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <ProjectStatsCards workspace={workspace} />
      <ProjectWorkflowTimeline workspace={workspace} />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Uploads, workflow runs, and failures from the current project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.recentActivity.length === 0 ? (
            <EmptyState variant="noRecentActivity" />
          ) : (
            <ul className="flex flex-col gap-3">
              {workspace.recentActivity.map((activity, index) => {
                const Icon = activityIcon(activity.tone);

                return (
                  <li key={activity.id}>
                    <div className="flex gap-3 rounded-[16px] border border-white/8 bg-secondary/40 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-secondary/80 text-primary">
                        <Icon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{activity.label}</p>
                          <Badge variant={activity.tone === "destructive" ? "destructive" : activity.tone === "warning" ? "outline" : activity.tone === "muted" ? "secondary" : "default"}>
                            {activity.tone}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-white/68">{activity.description}</p>
                        <p className="mt-2 text-xs text-white/52">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    {index < workspace.recentActivity.length - 1 ? <Separator className="my-3" /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}