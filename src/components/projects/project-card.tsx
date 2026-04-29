import Link from "next/link";
import { MapPinIcon } from "lucide-react";
import { ProjectStrict } from "@models/data";
import { getDashboardProjectStatus, getProjectTypeLabel } from "@/lib/project-presentation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/projects/status-badge";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: ProjectStrict;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const status = getDashboardProjectStatus(project);

  return (
    <Card size="sm" className="bg-card/88 shadow-[0_12px_30px_rgb(15_23_42_/_0.08)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{project.name}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="flex items-start gap-2">
          <MapPinIcon aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-primary" />
          <span>{project.address}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>Council: {project.council}</p>
        <p>Type: {getProjectTypeLabel(project.type)}</p>
        <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Project file
        </span>
        <Link
          href={`/dashboard/${project.id}`}
          aria-label={`Open ${project.name}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Open
        </Link>
      </CardFooter>
    </Card>
  );
}
