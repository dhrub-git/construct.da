import {
  FileStatus,
  FilesStrict,
  GenerateProjectReport,
  GenerateProjectReportStatus,
  ProcessingProjectFileStatus,
  ProjectMetadata,
  ProjectStage,
  ProjectStatus,
  ProjectStrict,
} from "@models/data";
import { normalizeSpatialConstraintMetadata, type SpatialConstraint, type SpatialConstraintSource } from "@/lib/spatial";

type WorkflowConnectionState = {
  connected: boolean;
  loading: boolean;
  fileStatus: ProcessingProjectFileStatus | null;
  reportStatus: GenerateProjectReportStatus | null;
};

export type ProjectWorkspaceReportMetadata = {
  generatedAt: string;
  version: number;
  sourceFilesCount: number;
  status: string;
};

export type ProjectWorkspaceRecentActivity = {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  tone: "default" | "muted" | "warning" | "destructive";
};

export type ProjectWorkspaceWorkflowStep = {
  key: string;
  label: string;
  state: "completed" | "active" | "pending" | "failed";
  details?: string;
};

export type ProjectWorkspaceState = {
  status: ProjectStatus;
  stage: ProjectStage;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  pendingFiles: number;
  completionPercent: number;
  lastRunDurationMs: number | null;
  hasPendingFiles: boolean;
  canStartProcessing: boolean;
  needsRerun: boolean;
  isProcessing: boolean;
  hasReport: boolean;
  latestReport: GenerateProjectReport | null;
  reportMarkdown: string | null;
  reportMetadata: ProjectWorkspaceReportMetadata | null;
  recentActivity: ProjectWorkspaceRecentActivity[];
  workflowSteps: ProjectWorkspaceWorkflowStep[];
  fileRows: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    status: FileStatus;
    includedInReport: boolean;
    url: string;
  }>;
  processingActionLabel: string;
  processingActionHint: string;
  spatialConstraints: SpatialConstraint[];
  hasSpatialConstraints: boolean;
  spatialConstraintSource: SpatialConstraintSource | null;
  spatialConstraintsLoadedAt: string | null;
  address: string;
  council: string;
  location: { lat: number; lng: number } | null;
};

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIsoDate(value: string | Date | null | undefined): string {
  const date = asDate(value);
  return date ? date.toISOString() : "Unknown";
}

function escapeMarkdown(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\r\n", "\n");
}

export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getLatestReport(reports: GenerateProjectReport[]): GenerateProjectReport | null {
  if (reports.length === 0) {
    return null;
  }

  return [...reports].sort((left, right) => {
    const versionDelta = right.version - left.version;
    if (versionDelta !== 0) {
      return versionDelta;
    }

    return (asDate(right.createdAt)?.getTime() ?? 0) - (asDate(left.createdAt)?.getTime() ?? 0);
  })[0] ?? null;
}

function mapProjectStatus(
  metadata: ProjectMetadata,
  latestReport: GenerateProjectReport | null,
  failedFiles: number,
  pendingFiles: number,
): ProjectStatus {
  if (metadata.processingStatus) {
    return metadata.processingStatus;
  }

  if (latestReport?.status === "FAILED") {
    return ProjectStatus.FAILED;
  }

  if (latestReport?.status === "PARTIAL") {
    return ProjectStatus.NEEDS_REVIEW;
  }

  if (latestReport?.status === "COMPLETED") {
    return ProjectStatus.COMPLETED;
  }

  if (failedFiles > 0 || pendingFiles > 0) {
    return ProjectStatus.NEEDS_REVIEW;
  }

  return ProjectStatus.CREATED;
}

function mapProjectStage(
  metadata: ProjectMetadata,
  latestReport: GenerateProjectReport | null,
  isProcessing: boolean,
): ProjectStage {
  if (metadata.stage) {
    return metadata.stage;
  }

  if (latestReport?.status === "COMPLETED") {
    return ProjectStage.COMPLETED;
  }

  if (isProcessing) {
    return ProjectStage.PARSING;
  }

  return ProjectStage.CREATED;
}

export function buildProjectReportMarkdown(report: GenerateProjectReport): string {
  const summary = report.content.summary;
  const checks = report.content.checks;
  const findings = report.findings;
  const checkResults = report.checkResults;

  const lines: string[] = [
    `# Compliance report v${report.version}`,
    "",
    `Generated: ${formatIsoDate(report.createdAt)}`,
    `Status: ${report.status}`,
    `Score: ${checks.score}/100`,
    `Risk level: ${checks.riskLevel}`,
    "",
    "## Executive summary",
    summary.executiveSummary,
    "",
    "## Summary",
    summary.summary,
    "",
    "## Likely risks",
    findings.length > 0
      ? findings.map((finding) => `- **${escapeMarkdown(finding.title)}** - ${escapeMarkdown(finding.detail)}`).join("\n")
      : "- No findings were recorded.",
    "",
    "## Recommended next steps",
    summary.recommendedNextSteps.length > 0
      ? summary.recommendedNextSteps.map((item) => `- ${escapeMarkdown(item)}`).join("\n")
      : "- None recorded.",
    "",
    "## Missing documents",
    summary.missingDocs.length > 0
      ? summary.missingDocs.map((item) => `- ${escapeMarkdown(item)}`).join("\n")
      : "- None.",
    "",
    "## Compliance checks",
    "| Check | Category | Result | Severity | Message |",
    "| --- | --- | --- | --- | --- |",
    ...checkResults.map(
      (check) =>
        `| ${escapeMarkdown(check.key)} | ${escapeMarkdown(check.category)} | ${check.passed ? "Pass" : "Fail"} | ${escapeMarkdown(check.severity)} | ${escapeMarkdown(check.message)} |`,
    ),
    "",
    "## Findings",
    findings.length > 0
      ? findings
          .map(
            (finding) => [
              `### ${escapeMarkdown(finding.title)}`,
              `Severity: ${escapeMarkdown(finding.severity)}`,
              finding.recommendation ? `Recommendation: ${escapeMarkdown(finding.recommendation)}` : "Recommendation: None",
              escapeMarkdown(finding.detail),
            ].join("\n\n"),
          )
          .join("\n\n")
      : "No findings recorded.",
  ];

  return lines.join("\n");
}

export function deriveProjectWorkspaceState(
  project: ProjectStrict,
  files: FilesStrict[],
  reports: GenerateProjectReport[],
  workflow: WorkflowConnectionState,
): ProjectWorkspaceState {
  const latestReport = getLatestReport(reports);
  const totalFiles = files.length;
  const processedFiles = files.filter((file) => file.status === FileStatus.PROCESSED).length;
  const failedFiles = files.filter((file) => file.status === FileStatus.FAILED).length;
  const pendingFiles = files.filter((file) => file.status === FileStatus.PENDING).length;
  const completionPercent = totalFiles === 0 ? 0 : Math.round((processedFiles / totalFiles) * 100);
  const hasReport = latestReport !== null;

  const filesUpdatedAt = asDate(project.metadata.filesUpdatedAt);
  const reportCreatedAt = asDate(latestReport?.createdAt);
  const hasNewFilesSinceReport = Boolean(
    filesUpdatedAt && reportCreatedAt && filesUpdatedAt.getTime() > reportCreatedAt.getTime(),
  );

  const isProcessing =
    project.metadata.processingStatus === ProjectStatus.IN_PROGRESS ||
    workflow.connected ||
    workflow.loading;

  const hasPendingFiles = pendingFiles > 0 || failedFiles > 0 || project.metadata.processingStatus === ProjectStatus.NEEDS_REVIEW;
  const needsRerun =
    !hasReport
      ? totalFiles > 0
      : hasNewFilesSinceReport || hasPendingFiles || latestReport?.status !== "COMPLETED";

  const canStartProcessing =
    !isProcessing && totalFiles > 0 && (latestReport === null || needsRerun || project.metadata.processingStatus === ProjectStatus.FAILED);

  const status = mapProjectStatus(project.metadata, latestReport, failedFiles, pendingFiles);
  const stage = mapProjectStage(project.metadata, latestReport, isProcessing);
  const lastRunDurationMs = project.metadata.lastRunDurationMs ?? null;
  const reportMarkdown = latestReport ? buildProjectReportMarkdown(latestReport) : null;
  const spatialMetadata = normalizeSpatialConstraintMetadata(project.metadata);
  const spatialConstraints = spatialMetadata.spatialConstraints;
  const geoEncoding = project.metadata.geoEncoding;
  const location = typeof geoEncoding?.lat === "number" && typeof geoEncoding?.lng === "number"
    ? { lat: geoEncoding.lat, lng: geoEncoding.lng }
    : null;
  const reportMetadata = latestReport
    ? {
        generatedAt: formatIsoDate(latestReport.createdAt),
        version: latestReport.version,
        sourceFilesCount: files.length,
        status: latestReport.status,
      }
    : null;

  const recentActivity: ProjectWorkspaceRecentActivity[] = [];

  recentActivity.push({
    id: `project-created-${project.id}`,
    label: "Project created",
    description: project.name,
    timestamp: project.createdAt.toISOString(),
    tone: "default",
  });

  const newestFile = [...files].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
  if (newestFile) {
    recentActivity.push({
      id: `file-uploaded-${newestFile.id}`,
      label: "Files uploaded",
      description: newestFile.name,
      timestamp: newestFile.createdAt.toISOString(),
      tone: "muted",
    });
  }

  if (latestReport) {
    recentActivity.push({
      id: `report-${latestReport.id}`,
      label: "Report generated",
      description: `Version ${latestReport.version} · ${latestReport.status}`,
      timestamp: latestReport.createdAt.toISOString(),
      tone: latestReport.status === "FAILED" ? "destructive" : "default",
    });
  }

  if (failedFiles > 0) {
    recentActivity.push({
      id: `failed-${project.id}`,
      label: "Failures detected",
      description: `${failedFiles} file${failedFiles === 1 ? "" : "s"} failed processing`,
      timestamp: files.find((file) => file.status === FileStatus.FAILED)?.createdAt.toISOString() ?? project.createdAt.toISOString(),
      tone: "warning",
    });
  }

  recentActivity.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));

  return {
    status,
    stage,
    totalFiles,
    processedFiles,
    failedFiles,
    pendingFiles,
    completionPercent,
    lastRunDurationMs,
    hasPendingFiles,
    canStartProcessing,
    needsRerun,
    isProcessing,
    hasReport,
    latestReport,
    reportMarkdown,
    reportMetadata,
    recentActivity,
    workflowSteps: buildWorkflowSteps(project, files.length, workflow, latestReport),
    fileRows: files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.metadata.fileType || file.metadata.mimeType || "Unknown",
      size: file.metadata.size,
      uploadedAt: file.createdAt.toISOString(),
      status: file.status,
      includedInReport: latestReport ? (asDate(file.createdAt)?.getTime() ?? 0) <= (asDate(latestReport.createdAt)?.getTime() ?? 0) : false,
      url: file.url,
    })),
    processingActionLabel: buildProcessingActionLabel(isProcessing, status, hasReport, needsRerun),
    processingActionHint: buildProcessingActionHint(isProcessing, hasReport, needsRerun, pendingFiles, failedFiles),
    spatialConstraints,
    hasSpatialConstraints: spatialConstraints.length > 0,
    spatialConstraintSource: spatialMetadata.spatialConstraintsSource ?? null,
    spatialConstraintsLoadedAt: spatialMetadata.spatialConstraintsLoadedAt ?? null,
    address: project.address,
    council: project.council,
    location,
  };
}

function buildProcessingActionLabel(
  isProcessing: boolean,
  status: ProjectStatus,
  hasReport: boolean,
  needsRerun: boolean,
): string {
  if (isProcessing) {
    return "Processing...";
  }

  if (!hasReport) {
    return "Start Processing";
  }

  if (status === ProjectStatus.FAILED) {
    return "Retry Processing";
  }

  if (needsRerun) {
    return "Re-run Report";
  }

  return "Generate Report Again";
}

function buildProcessingActionHint(
  isProcessing: boolean,
  hasReport: boolean,
  needsRerun: boolean,
  pendingFiles: number,
  failedFiles: number,
): string {
  if (isProcessing) {
    return "Live workflow updates are streaming now.";
  }

  if (!hasReport) {
    return "No report has been generated yet.";
  }

  if (pendingFiles > 0 || failedFiles > 0 || needsRerun) {
    return "New files or failed files require another processing pass.";
  }

  return "The latest report is up to date.";
}

function buildRecentActivity(
  project: ProjectStrict,
  files: FilesStrict[],
  latestReport: GenerateProjectReport | null,
): ProjectWorkspaceRecentActivity[] {
  const newestFile = [...files].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
  const failedFiles = files.filter((file) => file.status === FileStatus.FAILED);

  const recentActivity: ProjectWorkspaceRecentActivity[] = [
    {
      id: `project-created-${project.id}`,
      label: "Project created",
      description: project.name,
      timestamp: project.createdAt.toISOString(),
      tone: "default",
    },
  ];

  if (newestFile) {
    recentActivity.push({
      id: `file-uploaded-${newestFile.id}`,
      label: "Files uploaded",
      description: newestFile.name,
      timestamp: newestFile.createdAt.toISOString(),
      tone: "muted",
    });
  }

  if (latestReport) {
    recentActivity.push({
      id: `report-${latestReport.id}`,
      label: "Report generated",
      description: `Version ${latestReport.version} · ${latestReport.status}`,
      timestamp: latestReport.createdAt.toISOString(),
      tone: latestReport.status === "FAILED" ? "destructive" : "default",
    });
  }

  if (failedFiles.length > 0) {
    recentActivity.push({
      id: `failed-${project.id}`,
      label: "Failures detected",
      description: `${failedFiles.length} file${failedFiles.length === 1 ? "" : "s"} failed processing`,
      timestamp: files.find((file) => file.status === FileStatus.FAILED)?.createdAt.toISOString() ?? project.createdAt.toISOString(),
      tone: "warning",
    });
  }

  return recentActivity.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function buildWorkflowSteps(
  project: ProjectStrict,
  fileCount: number,
  workflow: WorkflowConnectionState,
  latestReport: GenerateProjectReport | null,
): ProjectWorkspaceWorkflowStep[] {
  const reportStage = workflow.reportStatus?.status ?? null;
  const fileProcessingActive = workflow.connected || workflow.loading || project.metadata.processingStatus === ProjectStatus.IN_PROGRESS;

  return [
    {
      key: "fetching-project",
      label: "Fetching Project",
      state: project.metadata.processingStartedAt ? "completed" : "active",
      details: project.metadata.processingStartedAt ? `Started ${formatIsoDate(project.metadata.processingStartedAt)}` : "Waiting for a processing run.",
    },
    {
      key: "reading-files",
      label: "Reading Files",
      state: fileProcessingActive ? "active" : latestReport ? "completed" : "pending",
      details: `${fileCount} file${fileCount === 1 ? "" : "s"} available`,
    },
    {
      key: "ocr-processing",
      label: "OCR Processing",
      state: fileProcessingActive ? "active" : latestReport ? "completed" : "pending",
    },
    {
      key: "extracting-facts",
      label: "Extracting Facts",
      state: reportStage === "FETCHING_RULES" || reportStage === "EXTRACTING_FACTS" ? "active" : reportStage ? "completed" : latestReport ? "completed" : "pending",
    },
    {
      key: "running-checks",
      label: "Running Checks",
      state: reportStage === "RUNNING_CHECKS" ? "active" : reportStage ? "completed" : latestReport ? "completed" : "pending",
    },
    {
      key: "generating-summary",
      label: "Generating Summary",
      state: reportStage === "GENERATING_SUMMARY" ? "active" : reportStage ? "completed" : latestReport ? "completed" : "pending",
    },
    {
      key: "saving-report",
      label: "Saving Report",
      state: reportStage === "SAVING_REPORT" ? "active" : reportStage === "FAILED" ? "failed" : reportStage === "COMPLETED" ? "completed" : latestReport ? "completed" : "pending",
    },
    {
      key: "completed",
      label: "Completed",
      state: reportStage === "COMPLETED" || latestReport?.status === "COMPLETED" ? "completed" : reportStage === "FAILED" ? "failed" : "pending",
      details: latestReport ? `Report v${latestReport.version}` : undefined,
    },
    {
      key: "failed",
      label: "Failed",
      state: reportStage === "FAILED" || latestReport?.status === "FAILED" ? "failed" : "pending",
    },
  ];
}

export {
  asDate,
  escapeMarkdown,
  formatIsoDate,
  getLatestReport,
  mapProjectStage,
  mapProjectStatus,
  buildRecentActivity,
};
