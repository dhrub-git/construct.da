import { ProjectType } from "@models/data";
import {
  CameraIcon,
  FileArchiveIcon,
  FileBarChartIcon,
  FileCheckIcon,
  FileCogIcon,
  FileSearchIcon,
  FileSpreadsheetIcon,
  FilesIcon,
  FileTextIcon,
  LeafIcon,
  MapIcon,
  MountainIcon,
  ShieldCheckIcon,
  TreesIcon,
  WavesIcon,
} from "lucide-react";

export type DocumentBadge = "RECOMMENDED" | "COMMON" | "CONDITIONAL";

export type RequiredDocumentDefinition = {
  id: string;
  fileType: string;
  name: string;
  description: string;
  badge: DocumentBadge;
  allowMultiple?: boolean;
  accept?: string;
  Icon: React.ComponentType<{ className?: string }>;
  priorityFor?: ProjectType[];
};

const defaultAccept = ".pdf,.doc,.docx,.xls,.xlsx,.csv,image/png,image/jpeg";
const imageOnlyAccept = "image/png,image/jpeg,image/webp";

const baseRequiredDocumentDefinitions = [
  {
    id: "site-plan",
    fileType: "SITE_PLAN",
    name: "Site Plan",
    description: "Boundary, setbacks, site levels, and building footprint.",
    badge: "COMMON",
    Icon: MapIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.SWIMMING_POOL, ProjectType.HOME_EXTENSION],
  },
  {
    id: "floor-plans",
    fileType: "FLOOR_PLANS",
    name: "Floor Plans",
    description: "Proposed internal layout with room dimensions and uses.",
    badge: "COMMON",
    Icon: FileSpreadsheetIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.HOME_EXTENSION, ProjectType.SECOND_STOREY_ADDITION],
  },
  {
    id: "elevations",
    fileType: "ELEVATIONS",
    name: "Elevations",
    description: "All facade elevations with heights and external finishes.",
    badge: "COMMON",
    Icon: MountainIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.HOME_EXTENSION, ProjectType.SECOND_STOREY_ADDITION],
  },
  {
    id: "survey-plan",
    fileType: "SURVEY_PLAN",
    name: "Survey Plan",
    description: "Existing conditions survey from a registered surveyor.",
    badge: "RECOMMENDED",
    Icon: FileSearchIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.SWIMMING_POOL, ProjectType.RETAINING_WALL],
  },
  {
    id: "see",
    fileType: "STATEMENT_OF_ENVIRONMENTAL_EFFECTS",
    name: "Statement of Environmental Effects (SEE)",
    description: "Planning merit, site context, and policy response.",
    badge: "COMMON",
    Icon: FileTextIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.CHANGE_OF_USE, ProjectType.DEMOLITION],
  },
  {
    id: "shadow-diagrams",
    fileType: "SHADOW_DIAGRAMS",
    name: "Shadow Diagrams",
    description: "Solar access impact at required seasonal time points.",
    badge: "CONDITIONAL",
    Icon: FileBarChartIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.SECOND_STOREY_ADDITION],
  },
  {
    id: "basix",
    fileType: "BASIX_CERTIFICATE",
    name: "BASIX Certificate",
    description: "Energy and water efficiency commitments for NSW applications.",
    badge: "RECOMMENDED",
    Icon: LeafIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.HOME_EXTENSION],
  },
  {
    id: "landscape-plan",
    fileType: "LANDSCAPE_PLAN",
    name: "Landscape Plan",
    description: "Soft/hard landscaping, deep soil zones, and planting schedule.",
    badge: "CONDITIONAL",
    Icon: TreesIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.GRANNY_FLAT],
  },
  {
    id: "stormwater",
    fileType: "STORMWATER_DRAINAGE_PLAN",
    name: "Stormwater / Drainage Plan",
    description: "On-site detention, roof drainage, and lawful point of discharge.",
    badge: "RECOMMENDED",
    Icon: WavesIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.SWIMMING_POOL, ProjectType.RETAINING_WALL],
  },
  {
    id: "structural-drawings",
    fileType: "STRUCTURAL_DRAWINGS",
    name: "Structural Drawings",
    description: "Engineering design details for load-bearing elements.",
    badge: "CONDITIONAL",
    Icon: FileCogIcon,
    priorityFor: [ProjectType.NEW_DWELLING, ProjectType.SECOND_STOREY_ADDITION, ProjectType.RETAINING_WALL],
  },
  {
    id: "waste-management",
    fileType: "WASTE_MANAGEMENT_PLAN",
    name: "Waste Management Plan",
    description: "Construction and ongoing waste handling arrangements.",
    badge: "RECOMMENDED",
    Icon: FileArchiveIcon,
  },
  {
    id: "title-documents",
    fileType: "TITLE_OWNERSHIP_DOCUMENTS",
    name: "Title / Ownership Documents",
    description: "Current title search, ownership evidence, and encumbrances.",
    badge: "COMMON",
    Icon: ShieldCheckIcon,
  },
  {
    id: "existing-site-photos",
    fileType: "EXISTING_SITE_PHOTOS",
    name: "Existing Photos of Site",
    description: "Current street and site conditions from multiple viewpoints.",
    badge: "COMMON",
    allowMultiple: true,
    accept: imageOnlyAccept,
    Icon: CameraIcon,
  },
  {
    id: "heritage-report",
    fileType: "HERITAGE_REPORT",
    name: "Heritage Report",
    description: "Impacts and recommendations for heritage constraints.",
    badge: "CONDITIONAL",
    Icon: FileCheckIcon,
  },
  {
    id: "traffic-access-report",
    fileType: "TRAFFIC_ACCESS_REPORT",
    name: "Traffic / Access Report",
    description: "Vehicle movement, access safety, and parking assessment.",
    badge: "CONDITIONAL",
    Icon: FileBarChartIcon,
    priorityFor: [ProjectType.SIGNAGE, ProjectType.CHANGE_OF_USE],
  },
  {
    id: "arborist-report",
    fileType: "ARBORIST_REPORT",
    name: "Arborist Report",
    description: "Tree protection zones, removal requests, and mitigation plan.",
    badge: "CONDITIONAL",
    Icon: TreesIcon,
  },
  {
    id: "acoustic-report",
    fileType: "ACOUSTIC_REPORT",
    name: "Acoustic Report",
    description: "Noise source analysis and acoustic treatment strategy.",
    badge: "CONDITIONAL",
    Icon: FileSearchIcon,
  },
  {
    id: "other-supporting-documents",
    fileType: "OTHER",
    name: "Other Supporting Documents",
    description: "Upload any additional evidence not listed above.",
    badge: "CONDITIONAL",
    allowMultiple: true,
    Icon: FilesIcon,
  },
] satisfies RequiredDocumentDefinition[];

export const requiredDocumentDefinitions: RequiredDocumentDefinition[] = baseRequiredDocumentDefinitions.map((definition) => ({
  ...definition,
  accept: definition.accept ?? defaultAccept,
}));

const projectTypeWeight: Record<ProjectType, number> = {
  NEW_DWELLING: 0,
  HOME_EXTENSION: 0,
  SECOND_STOREY_ADDITION: 0,
  GARAGE_OR_CARPORT: 1,
  GRANNY_FLAT: 1,
  SWIMMING_POOL: 1,
  CHANGE_OF_USE: 1,
  DEMOLITION: 1,
  SIGNAGE: 2,
  RETAINING_WALL: 2,
};

const badgeWeight: Record<DocumentBadge, number> = {
  COMMON: 0,
  RECOMMENDED: 1,
  CONDITIONAL: 2,
};

export function getOrderedRequiredDocuments(projectType: ProjectType): RequiredDocumentDefinition[] {
  return [...requiredDocumentDefinitions].sort((a, b) => {
    const aPriority = a.priorityFor?.includes(projectType) ? 0 : 1;
    const bPriority = b.priorityFor?.includes(projectType) ? 0 : 1;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const typeWeight = projectTypeWeight[projectType];
    if (typeWeight >= 1 && a.badge !== b.badge) {
      return badgeWeight[a.badge] - badgeWeight[b.badge];
    }

    return a.name.localeCompare(b.name);
  });
}
