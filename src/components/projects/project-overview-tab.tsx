"use client";

import {
  ActivityIcon,
  AlertTriangleIcon,
  FileUpIcon,
  MapPinnedIcon,
  RulerIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProjectWorkspaceState } from "@/lib/project-workspace";
import {
  SpatialConstraintCategory,
  SpatialConstraintSeverity,
  SpatialConstraintSource,
  SpatialConstraintStatus,
  type SpatialConstraint,
} from "@/lib/spatial";
import { ProjectConstraintMap } from "@/components/projects/project-constraint-map";
import { ProjectStatsCards } from "@/components/projects/project-stats-cards";
import { ProjectWorkflowTimeline } from "@/components/projects/project-workflow-timeline";

type ProjectOverviewTabProps = {
  projectId: string;
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

function severityBadgeVariant(severity: SpatialConstraint["severity"]): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case SpatialConstraintSeverity.HIGH:
      return "destructive";
    case SpatialConstraintSeverity.MEDIUM:
      return "outline";
    case SpatialConstraintSeverity.LOW:
      return "secondary";
    default:
      return "default";
  }
}

function statusLabel(status: SpatialConstraint["status"]): string {
  switch (status) {
    case SpatialConstraintStatus.CONFIRMED:
      return "Confirmed";
    case SpatialConstraintStatus.POTENTIAL:
      return "Potential";
    case SpatialConstraintStatus.NOT_TRIGGERED:
      return "Not triggered";
    default:
      return "Unknown";
  }
}

function categoryLabel(category: SpatialConstraint["category"]): string {
  switch (category) {
    case SpatialConstraintCategory.HERITAGE:
      return "Heritage";
    case SpatialConstraintCategory.FLOOD:
      return "Flood";
    case SpatialConstraintCategory.BUSHFIRE:
      return "Bushfire";
    case SpatialConstraintCategory.HEIGHT:
      return "Height";
    case SpatialConstraintCategory.ZONING:
      return "Zoning";
    default:
      return "Planning";
  }
}

function ConstraintSummaryCard({ constraint, icon: Icon }: { constraint: SpatialConstraint | undefined; icon: typeof MapPinnedIcon }) {
  return (
    <div className="flex gap-4 rounded-[16px] border border-border bg-secondary/40 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-secondary/80 text-primary">
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {constraint ? categoryLabel(constraint.category) : "Constraint"}
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {constraint?.value ?? "Not available"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {constraint?.description ?? "No fixture or live constraint has been attached to this project yet."}
        </p>
      </div>
    </div>
  );
}

function SpatialConstraintPanel({ projectId, workspace }: ProjectOverviewTabProps) {
  const zoning = workspace.spatialConstraints.find((constraint) => constraint.category === SpatialConstraintCategory.ZONING);
  const heightLimit = workspace.spatialConstraints.find((constraint) => constraint.category === SpatialConstraintCategory.HEIGHT);
  const riskCategories = new Set<SpatialConstraintCategory>([
    SpatialConstraintCategory.HERITAGE,
    SpatialConstraintCategory.FLOOD,
    SpatialConstraintCategory.BUSHFIRE,
  ]);
  const riskConstraints = workspace.spatialConstraints.filter((constraint) => riskCategories.has(constraint.category));
  const firstSource = workspace.spatialConstraints[0]?.source;
  const isFixture = workspace.spatialConstraintSource === SpatialConstraintSource.FIXTURE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spatial constraints</CardTitle>
        <CardDescription>
          Fixture-first planning controls for early advisory triage before a live map layer is connected.
        </CardDescription>
        {isFixture ? (
          <CardAction>
            <Badge variant="outline">Advisory fixture</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ProjectConstraintMap
          projectId={projectId}
          address={workspace.address}
          location={workspace.location}
          initialConstraints={workspace.spatialConstraints}
          initialSource={workspace.spatialConstraintSource}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ConstraintSummaryCard constraint={zoning} icon={MapPinnedIcon} />
          <ConstraintSummaryCard constraint={heightLimit} icon={RulerIcon} />
        </div>

        <div className="rounded-[16px] border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Risk overlays</p>
              <p className="mt-1 text-sm text-muted-foreground">Heritage, flood, and bushfire flags are advisory until verified against source layers.</p>
            </div>
            {firstSource ? <Badge variant="secondary">{firstSource.confidence} confidence</Badge> : null}
          </div>

          {riskConstraints.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No risk overlays have been attached.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {riskConstraints.map((constraint) => (
                <Badge key={constraint.id} variant={severityBadgeVariant(constraint.severity)}>
                  {categoryLabel(constraint.category)} · {statusLabel(constraint.status)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Source: {firstSource?.label ?? "Not attached"}</span>
          {workspace.spatialConstraintsLoadedAt ? (
            <span>· Loaded {new Date(workspace.spatialConstraintsLoadedAt).toLocaleString()}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectOverviewTab({ projectId, workspace }: ProjectOverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <ProjectStatsCards workspace={workspace} />
      <ProjectWorkflowTimeline workspace={workspace} />
      <SpatialConstraintPanel projectId={projectId} workspace={workspace} />

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
                    <div className="flex gap-3 rounded-[16px] border border-border bg-secondary/40 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-secondary/80 text-primary">
                        <Icon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{activity.label}</p>
                          <Badge variant={activity.tone === "destructive" ? "destructive" : activity.tone === "warning" ? "outline" : activity.tone === "muted" ? "secondary" : "default"}>
                            {activity.tone}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
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
