import Link from "next/link";
import { ProjectStrict, ProjectStatus } from "@models/data";
import { getProjectTypeLabel } from "@/lib/project-presentation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/projects/status-badge";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: ProjectStrict;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card size="sm" className="bg-secondary/55">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.address}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-white/68">
        <p>Council: {project.council}</p>
        <p>Type: {getProjectTypeLabel(project.type)}</p>
        <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter className="justify-between">
        <StatusBadge status={ProjectStatus.CREATED} />
        <Link href={`/dashboard/${project.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Open
        </Link>
      </CardFooter>
    </Card>
  );
}
