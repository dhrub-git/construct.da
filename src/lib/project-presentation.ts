import {
  FileStatus,
  ProjectType,
  DashboardResponse,
  FilesStrict,
  ProjectActivity,
  ProjectStage,
  ProjectStatus,
  ProjectStrict,
  ProjectWithFiles,
} from "@models/data";

const projectTypeLabels: Record<ProjectType, string> = {
  NEW_DWELLING: "New dwelling",
  HOME_EXTENSION: "Home extension",
  SECOND_STOREY_ADDITION: "Second storey addition",
  GARAGE_OR_CARPORT: "Garage or carport",
  GRANNY_FLAT: "Granny flat",
  SWIMMING_POOL: "Swimming pool",
  CHANGE_OF_USE: "Change of use",
  DEMOLITION: "Demolition",
  SIGNAGE: "Signage",
  RETAINING_WALL: "Retaining wall",
};

export function getProjectTypeLabel(projectType: ProjectType): string {
  return projectTypeLabels[projectType];
}

export function getDashboardProjectStatus(project: ProjectStrict): ProjectStatus {
  return project.metadata.processingStatus ?? ProjectStatus.CREATED;
}

export type DashboardMetrics = {
  total: number;
  active: number;
  needsReview: number;
  completed: number;
  councils: number;
};

export function buildDashboardMetrics(projects: ProjectStrict[]): DashboardMetrics {
  const statuses = projects.map(getDashboardProjectStatus);

  return {
    total: projects.length,
    active: statuses.filter((status) => status === ProjectStatus.CREATED || status === ProjectStatus.IN_PROGRESS).length,
    needsReview: statuses.filter((status) => status === ProjectStatus.NEEDS_REVIEW || status === ProjectStatus.FAILED).length,
    completed: statuses.filter((status) => status === ProjectStatus.COMPLETED).length,
    councils: new Set(projects.map((project) => project.council).filter(Boolean)).size,
  };
}

export function getProjectStage(files: FilesStrict[]): ProjectStage {
  if (files.length === 0) {
    return ProjectStage.CREATED;
  }

  if (files.some((file) => file.status === FileStatus.PROCESSING)) {
    return ProjectStage.PARSING;
  }

  if (files.some((file) => file.status === FileStatus.FAILED)) {
    return ProjectStage.COMPLIANCE_REVIEW;
  }

  if (files.every((file) => file.status === FileStatus.PROCESSED)) {
    return ProjectStage.COMPLETED;
  }

  return ProjectStage.FILES_UPLOADED;
}

export function getProjectStatus(files: FilesStrict[]): ProjectStatus {
  if (files.length === 0) {
    return ProjectStatus.CREATED;
  }

  if (files.some((file) => file.status === FileStatus.FAILED)) {
    return ProjectStatus.FAILED;
  }

  if (files.every((file) => file.status === FileStatus.PROCESSED)) {
    return ProjectStatus.COMPLETED;
  }

  if (files.some((file) => file.status === FileStatus.PROCESSING)) {
    return ProjectStatus.IN_PROGRESS;
  }

  return ProjectStatus.NEEDS_REVIEW;
}

export function getProjectTimeline(project: ProjectWithFiles): ProjectActivity[] {
  const createdEvent: ProjectActivity = {
    id: `project-created-${project.id}`,
    message: "Project created",
    createdAt: project.createdAt.toISOString(),
    stage: ProjectStage.CREATED,
  };

  const fileEvents = project.Files.map((file) => {
    const stage = file.status === FileStatus.PROCESSED
      ? ProjectStage.ANALYSIS
      : file.status === FileStatus.PROCESSING
        ? ProjectStage.PARSING
        : file.status === FileStatus.FAILED
          ? ProjectStage.COMPLIANCE_REVIEW
          : ProjectStage.FILES_UPLOADED;

    return {
      id: `file-${file.id}`,
      message: `File uploaded: ${file.name}`,
      createdAt: file.createdAt.toISOString(),
      stage,
    } satisfies ProjectActivity;
  });

  return [createdEvent, ...fileEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildDashboardResponse(projects: ProjectStrict[]): DashboardResponse {
  return {
    projects,
    total: projects.length,
  };
}
