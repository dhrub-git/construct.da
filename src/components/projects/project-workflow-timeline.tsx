"use client";

import { CircleCheckBigIcon, CircleDashedIcon, CircleDotDashedIcon, CircleSlashIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ProjectWorkspaceState, ProjectWorkspaceWorkflowStep } from "@/lib/project-workspace";

type ProjectWorkflowTimelineProps = {
  workspace: ProjectWorkspaceState;
};

function stepIcon(state: ProjectWorkspaceWorkflowStep["state"]) {
  switch (state) {
    case "completed":
      return CircleCheckBigIcon;
    case "active":
      return CircleDotDashedIcon;
    case "failed":
      return CircleSlashIcon;
    default:
      return CircleDashedIcon;
  }
}

function stepTone(state: ProjectWorkspaceWorkflowStep["state"]): "default" | "secondary" | "outline" | "destructive" {
  switch (state) {
    case "completed":
      return "default";
    case "active":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export function ProjectWorkflowTimeline({ workspace }: ProjectWorkflowTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow timeline</CardTitle>
        <CardDescription>
          Live stage updates from the processing and report workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {workspace.workflowSteps.map((step, index) => {
            const Icon = stepIcon(step.state);

            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn("flex size-8 items-center justify-center rounded-full border", step.state === "completed" && "border-primary bg-primary text-primary-foreground", step.state === "active" && "border-primary bg-primary/10 text-primary", step.state === "failed" && "border-destructive bg-destructive/10 text-destructive", step.state === "pending" && "border-border bg-secondary/50 text-muted-foreground")}>
                    <Icon />
                  </span>
                  {index < workspace.workflowSteps.length - 1 ? (
                    <Separator orientation="vertical" className="mt-2 h-7 bg-secondary" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{step.label}</p>
                    <Badge variant={stepTone(step.state)}>{step.state}</Badge>
                  </div>
                  {step.details ? <p className="mt-1 text-sm text-muted-foreground">{step.details}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
