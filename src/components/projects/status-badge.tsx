import { FileStatus, ProjectStatus } from "@models/data";
import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: ProjectStatus | FileStatus;
};

function toLabel(status: ProjectStatus | FileStatus): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toVariant(status: ProjectStatus | FileStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === ProjectStatus.FAILED) {
    return "destructive";
  }

  if (status === ProjectStatus.COMPLETED || status === FileStatus.PROCESSED) {
    return "default";
  }

  if (status === ProjectStatus.IN_PROGRESS || status === FileStatus.PROCESSING) {
    return "outline";
  }

  return "secondary";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={toVariant(status)}>{toLabel(status)}</Badge>;
}
