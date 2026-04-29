import { ChecksResult, ExtractedFacts, ReportSummary, RulesPack, WorkflowIssue } from "@/lib/agent/types";
import type { Files, Project, ProjectReport, ProjectReportCheckResult, ProjectReportFinding } from "@prisma/client";

export const FileStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    PROCESSED: "PROCESSED",
    FAILED: "FAILED",
} as const;

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];

export const ProjectType = {
    NEW_DWELLING: "NEW_DWELLING",
    HOME_EXTENSION: "HOME_EXTENSION",
    SECOND_STOREY_ADDITION: "SECOND_STOREY_ADDITION",
    GARAGE_OR_CARPORT: "GARAGE_OR_CARPORT",
    GRANNY_FLAT: "GRANNY_FLAT",
    SWIMMING_POOL: "SWIMMING_POOL",
    CHANGE_OF_USE: "CHANGE_OF_USE",
    DEMOLITION: "DEMOLITION",
    SIGNAGE: "SIGNAGE",
    RETAINING_WALL: "RETAINING_WALL",
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export enum ProjectStatus {
    CREATED = "CREATED",
    IN_PROGRESS = "IN_PROGRESS",
    NEEDS_REVIEW = "NEEDS_REVIEW",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export enum ProjectStage {
    CREATED = "CREATED",
    FILES_UPLOADED = "FILES_UPLOADED",
    PARSING = "PARSING",
    ANALYSIS = "ANALYSIS",
    COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",
    COMPLETED = "COMPLETED",
}

export interface ProjectMetadata {
    geoEncoding: Coordinates;
    runId?: string;
    stage: ProjectStage;
    processingStatus?: ProjectStatus;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    filesUpdatedAt?: string;
    reportVersion?: number;
    lastRunDurationMs?: number;
}

export interface ProjectSpecs {
    name: string;
    description?: string;
    address: string;
    type: ProjectType;
    council: string;
    userId: string;
    files: Omit<FileSpecs, "projectId">[];
}

export interface FileSpecs {
    filename: string;
    mimetype: string;
    size: number;
    projectId: string;
    userId: string;
    url: string;
    fileType: string;
}

interface Coordinates {
    lat: number;
    lng: number;
}

export interface ProjectWithFiles extends Omit<Project, "metadata"> {
    metadata: ProjectMetadata;
    Files: FilesStrict[];
}

export interface ProjectStrict extends Omit<Project, "metadata"> {
    metadata: ProjectMetadata;
}

export interface FilesStrict extends Omit<Files, "metadata"> {
    metadata: {
        mimeType: string;
        size: number;
        fileType: string;
        stage?: "STARTED" | "PROCESSED" | "COMPLETED_WITHOUT_CHUNKS" | "FAILED";
        startedAt?: string;
        completedAt?: string;
        failedAt?: string;
        error?: string
    }
}

export interface AddressSuggestion {
    id: string;
    label: string;
    address: string;
    council: string;
    state: string;
    postcode?: string;
    countryCode: string;
    lat?: number;
    lng?: number;
}

export interface DashboardResponse {
    projects: ProjectStrict[];
    total: number;
}

export interface ProjectActivity {
    id: string;
    message: string;
    createdAt: string;
    stage: ProjectStage;
}

export interface ProjectDetailsResponse {
    project: Omit<ProjectWithFiles, "Files">;
    files: FilesStrict[];
    stage: ProjectStage;
    status: ProjectStatus;
    activity: ProjectActivity[];
}

export interface CreateProjectPayload {
    projectName: string;
    description?: string;
    address: string;
    council: string;
    projectType: ProjectType;
    userId: string;
    files: Omit<FileSpecs, "projectId">[];
}

export interface ProjectFileRow {
    id: string;
    filename: string;
    fileType: string;
    size: number;
    uploadedAt: string;
    status: FileStatus;
    url: string;
}

export interface GenerateProjectReport extends Omit<ProjectReport, "findingsJson" | "factsJson" | "rulesJson" | "rawOutputJson" | "content"> {
    facts: ExtractedFacts;
    rules: RulesPack;
    content: {
        summary: ReportSummary;
        checks: ChecksResult;
    };
    rawOutput: {
        facts: ExtractedFacts;
        rules: RulesPack;
        summary: ReportSummary;
        checks: ChecksResult;
        issues: WorkflowIssue[];
    }
    findings: ProjectReportFinding[];
    checkResults: ProjectReportCheckResult[];
}

export interface ProcessingProjectFileStatus {
    completed: number;
    total: number;
    failed: number;
    completedFiles: string[];
    failedFiles: string[];
    processingFiles: string[];
    processingComplete: boolean;
    nextRunId: string | null;
}

export interface GenerateProjectReportStatus {
    status: "FETCHING_RULES" | "EXTRACTING_FACTS" | "RUNNING_CHECKS" | "GENERATING_SUMMARY" | "SAVING_REPORT" | "COMPLETED" | "FAILED";
    progress: number; // 0 to 100
    issues: WorkflowIssue[];
}
