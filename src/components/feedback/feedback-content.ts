import {
  ActivityIcon,
  AlertTriangleIcon,
  BanIcon,
  BellOffIcon,
  FileXIcon,
  FolderOpenIcon,
  GaugeCircleIcon,
  MilestoneIcon,
  SearchXIcon,
  ShieldAlertIcon,
  type LucideIcon,
} from "lucide-react";

export type EmptyStateVariant =
  | "noRecentActivity"
  | "noNotifications"
  | "noMetrics"
  | "noProjects"
  | "noSearchResults"
  | "noFiles"
  | "noMilestones";

export type ErrorStateVariant =
  | "dashboardFetch"
  | "projectFetch"
  | "widgetFetch"
  | "tableFetch"
  | "routeCrash"
  | "permissionDenied"
  | "notFound";

export type EmptyStateContent = {
  icon: LucideIcon;
  title: string;
  message: string;
  ctaLabel?: string;
};

export type ErrorStateContent = {
  icon: LucideIcon;
  title: string;
  message: string;
  technicalMessage?: string;
  retryLabel?: string;
  backLabel?: string;
  supportLabel?: string;
};

export const SKELETON_LAYOUT = {
  dashboard: {
    kpiCards: 4,
    activityRows: 5,
    tableRows: 6,
  },
  project: {
    metaCards: 3,
    fileRows: 5,
    activityRows: 4,
  },
} as const;

export const EMPTY_STATE_CONTENT: Record<EmptyStateVariant, EmptyStateContent> = {
  noRecentActivity: {
    icon: ActivityIcon,
    title: "No recent activity",
    message: "Actions and status updates will appear here once your team starts working in this project.",
  },
  noNotifications: {
    icon: BellOffIcon,
    title: "All caught up",
    message: "There are no new notifications right now.",
  },
  noMetrics: {
    icon: GaugeCircleIcon,
    title: "Metrics will appear soon",
    message: "As project data is processed, this area will populate with readiness and compliance indicators.",
  },
  noProjects: {
    icon: FolderOpenIcon,
    title: "No projects yet",
    message: "Create your first project to start uploads, tracking, and DA readiness review.",
    ctaLabel: "Create your first project",
  },
  noSearchResults: {
    icon: SearchXIcon,
    title: "No matches found",
    message: "Try a different project name, council, or address keyword.",
  },
  noFiles: {
    icon: FileXIcon,
    title: "No files uploaded",
    message: "Upload project documents to begin parsing, analysis, and compliance checks.",
    ctaLabel: "Upload files",
  },
  noMilestones: {
    icon: MilestoneIcon,
    title: "No milestones yet",
    message: "Milestones will appear after your first workflow events are recorded.",
  },
};

export const ERROR_STATE_CONTENT: Record<ErrorStateVariant, ErrorStateContent> = {
  dashboardFetch: {
    icon: AlertTriangleIcon,
    title: "Unable to load dashboard",
    message: "We could not load your projects and summary data. Try refreshing this view.",
    retryLabel: "Retry",
    backLabel: "Back to workspace",
    supportLabel: "Contact support",
  },
  projectFetch: {
    icon: AlertTriangleIcon,
    title: "Unable to load project",
    message: "Project details did not load correctly. Retry to fetch the latest data.",
    retryLabel: "Retry",
    backLabel: "Back to projects",
    supportLabel: "Contact support",
  },
  widgetFetch: {
    icon: ShieldAlertIcon,
    title: "Widget data unavailable",
    message: "This panel failed to load. You can retry without leaving the page.",
    retryLabel: "Retry panel",
  },
  tableFetch: {
    icon: ShieldAlertIcon,
    title: "Table failed to load",
    message: "Rows could not be retrieved right now. Retry to continue.",
    retryLabel: "Retry table",
  },
  routeCrash: {
    icon: AlertTriangleIcon,
    title: "Something went wrong",
    message: "An unexpected error interrupted this page. Retry to recover.",
    technicalMessage: "If this keeps happening, share the error digest with support.",
    retryLabel: "Try again",
    backLabel: "Go back",
    supportLabel: "Contact support",
  },
  permissionDenied: {
    icon: BanIcon,
    title: "Access restricted",
    message: "You do not have permission to view this content.",
    backLabel: "Back to dashboard",
    supportLabel: "Request access",
  },
  notFound: {
    icon: SearchXIcon,
    title: "Page not found",
    message: "This resource may have moved or no longer exists.",
    backLabel: "Back to dashboard",
  },
};
