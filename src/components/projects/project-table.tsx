import Link from "next/link";
import { ProjectStrict, ProjectStatus } from "@models/data";
import { getProjectTypeLabel } from "@/lib/project-presentation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/projects/status-badge";
import { cn } from "@/lib/utils";

type ProjectTableProps = {
  projects: ProjectStrict[];
};

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Council</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-semibold text-white">{project.name}</TableCell>
            <TableCell className="max-w-72 truncate text-muted-foreground">{project.address}</TableCell>
            <TableCell className="text-muted-foreground">{project.council}</TableCell>
            <TableCell className="text-muted-foreground">{getProjectTypeLabel(project.type)}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <StatusBadge status={ProjectStatus.CREATED} />
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/dashboard/${project.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
