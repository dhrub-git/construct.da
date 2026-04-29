import { ProjectStage, ProjectStatus, ProjectType, type FileSpecs, type ProjectMetadata, type ProjectSpecs } from "@models/data";
import {
  normalizeSpatialConstraints,
  SpatialConstraintCategory,
  SpatialConstraintSeverity,
  SpatialConstraintSource,
  SpatialConstraintStatus,
  type SpatialConstraint,
  type SpatialConstraintSourceMetadata,
} from "@/lib/spatial";

export type MasterViewDocumentFixture = {
  id: string;
  description: string;
  documentDate: string;
  fileType: string;
  downloadKey: string;
  fileName: string;
};

export type MasterViewApplicationFixture = {
  applicationNumber: string;
  councilReference: string;
  sourceUrl: string;
  address: string;
  lotDp: string;
  council: string;
  description: string;
  submittedDate: string;
  applicationType: string;
  applicant: string;
  pca: string;
  officer: string;
  status: string;
  determinationType: string;
  estimatedCost: string;
  notificationStart: string;
  notificationEnd: string;
  zoning: string;
  siteAreaRange: string;
  proposedGfa: string;
  heightControl: string;
  heritageSummary: string;
  documents: MasterViewDocumentFixture[];
};

const MASTER_VIEW_ORIGIN = "https://masterview.northsydney.nsw.gov.au";
const ROSS_STREET_RETRIEVED_AT = "2026-04-29T05:03:42.000Z";

export const ROSS_STREET_MASTER_VIEW_APPLICATION: MasterViewApplicationFixture = {
  applicationNumber: "10.2026.00000172.001",
  councilReference: "DA172/2026",
  sourceUrl: `${MASTER_VIEW_ORIGIN}/Application/ApplicationDetails/010.2026.00000172.001/`,
  address: "15A Ross Street, Waverton NSW 2060",
  lotDp: "Lot B DP 325009",
  council: "North Sydney Council",
  description: "Alterations and additions to a semi-detached dwelling including ground and first floor extension, internal reconfiguration and associated works.",
  submittedDate: "2026-04-24",
  applicationType: "Development Application",
  applicant: "Developable Pty Ltd",
  pca: "North Sydney Council",
  officer: "Min-Shih Wu",
  status: "In Progress",
  determinationType: "Pending",
  estimatedCost: "$330,000.00",
  notificationStart: "2026-05-13",
  notificationEnd: "2026-05-27",
  zoning: "R2 Low Density Residential",
  siteAreaRange: "234-241.4 sqm",
  proposedGfa: "172 sqm",
  heightControl: "8.5 m",
  heritageSummary: "Not a heritage item and not within a conservation area; near heritage items at 17 and 21 Ross Street and the Bay Road Conservation Area; referred to Heritage Officer.",
  documents: [
    { id: "basix", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - BASIX", documentDate: "2026-04-20", fileType: "BASIX_CERTIFICATE", downloadKey: "folder-10829467", fileName: "Document Set 10829467.pdf" },
    { id: "heritage-statement", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Heritage Statement", documentDate: "2026-04-20", fileType: "HERITAGE_REPORT", downloadKey: "folder-10829472", fileName: "Document Set 10829472.pdf" },
    { id: "landscape-plan", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Landscape plan", documentDate: "2026-04-20", fileType: "LANDSCAPE_PLAN", downloadKey: "folder-10829473", fileName: "Document Set 10829473.pdf" },
    { id: "da-application-form", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - DA Application Form", documentDate: "2026-04-20", fileType: "DA_APPLICATION_FORM", downloadKey: "folder-10829475", fileName: "Document Set 10829475.pdf" },
    { id: "materials-finishes", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Schedule of colours, materials and finishes", documentDate: "2026-04-20", fileType: "MATERIALS_FINISHES_SCHEDULE", downloadKey: "folder-10829477", fileName: "Document Set 10829477.pdf" },
    { id: "shadow-diagrams", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Shadow diagrams", documentDate: "2026-04-20", fileType: "SHADOW_DIAGRAMS", downloadKey: "folder-10829478", fileName: "Document Set 10829478.pdf" },
    { id: "site-plans", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Site plans", documentDate: "2026-04-20", fileType: "SITE_PLAN", downloadKey: "folder-10829479", fileName: "Document Set 10829479.pdf" },
    { id: "see", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - SEE", documentDate: "2026-04-20", fileType: "STATEMENT_OF_ENVIRONMENTAL_EFFECTS", downloadKey: "folder-10829480", fileName: "Document Set 10829480.pdf" },
    { id: "stormwater", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Stormwater drainage plan", documentDate: "2026-04-20", fileType: "STORMWATER_DRAINAGE_PLAN", downloadKey: "folder-10829481", fileName: "Document Set 10829481.pdf" },
    { id: "survey", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Survey plan", documentDate: "2026-04-20", fileType: "SURVEY_PLAN", downloadKey: "folder-10829483", fileName: "Document Set 10829483.pdf" },
    { id: "waste", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Lodgement - Waste management plan", documentDate: "2026-04-20", fileType: "WASTE_MANAGEMENT_PLAN", downloadKey: "folder-10829491", fileName: "Document Set 10829491.pdf" },
    { id: "notification-plans", description: "DA172/2026 - PAN-631847 - 15A Ross Street - Add Info/Amended Plans - Notification plans", documentDate: "2026-04-24", fileType: "NOTIFICATION_PLANS", downloadKey: "folder-10836936", fileName: "Document Set 10836936.pdf" },
  ],
};

export function buildMasterViewDocumentUrl(document: Pick<MasterViewDocumentFixture, "downloadKey" | "fileName">): string {
  const params = new URLSearchParams({
    key: document.downloadKey,
    fileName: document.fileName,
  });

  return `${MASTER_VIEW_ORIGIN}/document/download?${params.toString()}`;
}

export function isRossStreetMasterViewApplicationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase() === "masterview.northsydney.nsw.gov.au"
      && url.pathname.toLowerCase().includes("/application/applicationdetails/010.2026.00000172.001");
  } catch {
    return false;
  }
}

function buildSource(): SpatialConstraintSourceMetadata {
  return {
    type: SpatialConstraintSource.MANUAL,
    label: "North Sydney MasterView DA172/2026 lodged documents",
    confidence: "high",
    retrievedAt: ROSS_STREET_RETRIEVED_AT,
    url: ROSS_STREET_MASTER_VIEW_APPLICATION.sourceUrl,
  };
}

export function buildRossStreetSpatialConstraints(): SpatialConstraint[] {
  const source = buildSource();

  return normalizeSpatialConstraints([
    {
      id: "ross-street-zoning",
      category: SpatialConstraintCategory.ZONING,
      label: "Land zoning",
      value: ROSS_STREET_MASTER_VIEW_APPLICATION.zoning,
      description: "SEE identifies R2 Low Density Residential and says the semi-detached dwelling alterations are permissible with consent.",
      severity: SpatialConstraintSeverity.INFO,
      status: SpatialConstraintStatus.CONFIRMED,
      source,
      evidence: ["MasterView SEE: North Sydney LEP 2013 table"],
    },
    {
      id: "ross-street-height-control",
      category: SpatialConstraintCategory.HEIGHT,
      label: "Maximum building height",
      value: ROSS_STREET_MASTER_VIEW_APPLICATION.heightControl,
      description: "The lodged SEE and plans identify the 8.5 m height control and mark LEP height compliance as satisfied.",
      severity: SpatialConstraintSeverity.LOW,
      status: SpatialConstraintStatus.CONFIRMED,
      source,
      evidence: ["Site plans: max building height 8.5 m", "SEE: Height of buildings YES"],
    },
    {
      id: "ross-street-heritage-adjacent",
      category: SpatialConstraintCategory.HERITAGE,
      label: "Heritage-adjacent context",
      value: "Not listed; nearby heritage items and conservation area",
      description: ROSS_STREET_MASTER_VIEW_APPLICATION.heritageSummary,
      severity: SpatialConstraintSeverity.MEDIUM,
      status: SpatialConstraintStatus.POTENTIAL,
      source,
      evidence: ["Heritage Statement", "MasterView tracking: Referral to Heritage Officer"],
    },
    {
      id: "ross-street-notification",
      category: SpatialConstraintCategory.PLANNING_CONTROL,
      label: "Public notification",
      value: "13 May 2026 to 27 May 2026",
      description: "MasterView tracking records advertising notification for this pending DA.",
      severity: SpatialConstraintSeverity.INFO,
      status: SpatialConstraintStatus.CONFIRMED,
      source,
      evidence: ["MasterView tracking table"],
    },
  ]);
}

export function buildRossStreetMasterViewProjectMetadata(): ProjectMetadata {
  const application = ROSS_STREET_MASTER_VIEW_APPLICATION;

  return {
    geoEncoding: { lat: -33.8378342, lng: 151.1950263 },
    state: "NSW",
    runId: null,
    stage: ProjectStage.COMPLETED,
    processingStatus: ProjectStatus.COMPLETED,
    filesUpdatedAt: ROSS_STREET_RETRIEVED_AT,
    processingCompletedAt: ROSS_STREET_RETRIEVED_AT,
    reportVersion: 1,
    spatialConstraints: buildRossStreetSpatialConstraints(),
    spatialConstraintsLoadedAt: ROSS_STREET_RETRIEVED_AT,
    spatialConstraintsSource: SpatialConstraintSource.MANUAL,
    masterView: {
      applicationNumber: application.applicationNumber,
      councilReference: application.councilReference,
      sourceUrl: application.sourceUrl,
      status: application.status,
      determinationType: application.determinationType,
      submittedDate: application.submittedDate,
      notificationStart: application.notificationStart,
      notificationEnd: application.notificationEnd,
      estimatedCost: application.estimatedCost,
      applicant: application.applicant,
      officer: application.officer,
      documents: application.documents.map((document) => ({
        id: document.id,
        description: document.description,
        documentDate: document.documentDate,
        fileType: document.fileType,
        url: buildMasterViewDocumentUrl(document),
      })),
    },
    planningFacts: {
      zoning: application.zoning,
      siteArea: application.siteAreaRange,
      proposedGfa: application.proposedGfa,
      heightControl: application.heightControl,
      heritageSummary: application.heritageSummary,
      controlsComplianceSummary: "SEE states the building envelope remains within maximum building height, setbacks, site coverage, and landscaped area controls.",
    },
    clause46: {
      triggered: false,
      reason: "Not triggered for this control case: the SEE states height and relevant controls are compliant, so the app must not hallucinate a cl. 4.6 variation request.",
      source: "MasterView lodged SEE and site plans",
    },
  };
}

export function buildRossStreetMasterViewFileSpecs(userId: string): Omit<FileSpecs, "projectId">[] {
  return ROSS_STREET_MASTER_VIEW_APPLICATION.documents.map((document) => ({
    filename: `${document.description}.pdf`,
    mimetype: "application/pdf",
    size: 0,
    userId,
    url: buildMasterViewDocumentUrl(document),
    fileType: document.fileType,
  }));
}

export function buildRossStreetMasterViewProjectSpecs(userId: string): ProjectSpecs {
  const application = ROSS_STREET_MASTER_VIEW_APPLICATION;

  return {
    name: `${application.councilReference} · 15A Ross Street`,
    description: `${application.description} Live North Sydney MasterView control case: document ingestion, controls extraction, heritage-adjacent referral detection, and no cl. 4.6 hallucination.`,
    address: application.address,
    council: application.council,
    type: ProjectType.HOME_EXTENSION,
    userId,
    files: buildRossStreetMasterViewFileSpecs(userId),
  };
}
