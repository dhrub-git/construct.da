export const SpatialConstraintSource = {
  FIXTURE: "fixture",
  ARCGIS: "arcgis",
  MANUAL: "manual",
} as const;

export type SpatialConstraintSource = (typeof SpatialConstraintSource)[keyof typeof SpatialConstraintSource];

export const SpatialConstraintSeverity = {
  INFO: "info",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type SpatialConstraintSeverity = (typeof SpatialConstraintSeverity)[keyof typeof SpatialConstraintSeverity];

export const SpatialConstraintStatus = {
  CONFIRMED: "confirmed",
  POTENTIAL: "potential",
  NOT_TRIGGERED: "not_triggered",
  UNKNOWN: "unknown",
} as const;

export type SpatialConstraintStatus = (typeof SpatialConstraintStatus)[keyof typeof SpatialConstraintStatus];

export const SpatialConstraintCategory = {
  ZONING: "zoning",
  HEIGHT: "height",
  HERITAGE: "heritage",
  FLOOD: "flood",
  BUSHFIRE: "bushfire",
  PLANNING_CONTROL: "planning_control",
} as const;

export type SpatialConstraintCategory = (typeof SpatialConstraintCategory)[keyof typeof SpatialConstraintCategory];

export type SpatialConstraintConfidence = "low" | "medium" | "high";

export type SpatialConstraintSourceMetadata = {
  type: SpatialConstraintSource;
  label: string;
  confidence: SpatialConstraintConfidence;
  retrievedAt: string;
  url?: string;
};

export type SpatialConstraint = {
  id: string;
  category: SpatialConstraintCategory;
  label: string;
  value: string;
  description?: string;
  severity: SpatialConstraintSeverity;
  status: SpatialConstraintStatus;
  source: SpatialConstraintSourceMetadata;
  evidence?: string[];
};

export type SpatialConstraintMetadataInput = {
  spatialConstraints?: unknown;
  spatialConstraintsLoadedAt?: string;
  spatialConstraintsSource?: unknown;
};

export type SpatialConstraintMetadata = {
  spatialConstraints: SpatialConstraint[];
  spatialConstraintsLoadedAt?: string;
  spatialConstraintsSource?: SpatialConstraintSource;
};

export const SPATIAL_FIXTURE_RETRIEVED_AT = "2026-04-29T00:00:00.000Z";

const DEFAULT_SOURCE: SpatialConstraintSourceMetadata = {
  type: SpatialConstraintSource.FIXTURE,
  label: "Deterministic planning constraint fixture",
  confidence: "medium",
  retrievedAt: SPATIAL_FIXTURE_RETRIEVED_AT,
};

const CATEGORY_ORDER: SpatialConstraintCategory[] = [
  SpatialConstraintCategory.ZONING,
  SpatialConstraintCategory.HEIGHT,
  SpatialConstraintCategory.HERITAGE,
  SpatialConstraintCategory.FLOOD,
  SpatialConstraintCategory.BUSHFIRE,
  SpatialConstraintCategory.PLANNING_CONTROL,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSpatialConstraintSource(value: unknown): value is SpatialConstraintSource {
  return Object.values(SpatialConstraintSource).includes(value as SpatialConstraintSource);
}

function isSpatialConstraintSeverity(value: unknown): value is SpatialConstraintSeverity {
  return Object.values(SpatialConstraintSeverity).includes(value as SpatialConstraintSeverity);
}

function isSpatialConstraintStatus(value: unknown): value is SpatialConstraintStatus {
  return Object.values(SpatialConstraintStatus).includes(value as SpatialConstraintStatus);
}

function isSpatialConstraintCategory(value: unknown): value is SpatialConstraintCategory {
  return Object.values(SpatialConstraintCategory).includes(value as SpatialConstraintCategory);
}

function isSpatialConstraintConfidence(value: unknown): value is SpatialConstraintConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items.map((item) => item.trim()) : undefined;
}

function normalizeSource(source: unknown, fallback?: Partial<SpatialConstraintSourceMetadata>): SpatialConstraintSourceMetadata {
  const sourceRecord = isRecord(source) ? source : {};

  return {
    type: isSpatialConstraintSource(sourceRecord.type) ? sourceRecord.type : fallback?.type ?? DEFAULT_SOURCE.type,
    label: stringOrFallback(sourceRecord.label, fallback?.label ?? DEFAULT_SOURCE.label),
    confidence: isSpatialConstraintConfidence(sourceRecord.confidence)
      ? sourceRecord.confidence
      : fallback?.confidence ?? DEFAULT_SOURCE.confidence,
    retrievedAt: stringOrFallback(sourceRecord.retrievedAt, fallback?.retrievedAt ?? DEFAULT_SOURCE.retrievedAt),
    url: optionalString(sourceRecord.url) ?? fallback?.url,
  };
}

export function normalizeSpatialConstraint(
  value: unknown,
  fallback: Partial<SpatialConstraint> = {},
): SpatialConstraint {
  const record = isRecord(value) ? value : {};
  const fallbackSource = fallback.source;
  const source = normalizeSource(record.source, fallbackSource);
  const category = isSpatialConstraintCategory(record.category)
    ? record.category
    : fallback.category ?? SpatialConstraintCategory.PLANNING_CONTROL;

  return {
    id: stringOrFallback(record.id, fallback.id ?? `${category}-constraint`),
    category,
    label: stringOrFallback(record.label, fallback.label ?? "Planning constraint"),
    value: stringOrFallback(record.value, fallback.value ?? "Unknown"),
    description: optionalString(record.description) ?? fallback.description,
    severity: isSpatialConstraintSeverity(record.severity)
      ? record.severity
      : fallback.severity ?? SpatialConstraintSeverity.INFO,
    status: isSpatialConstraintStatus(record.status)
      ? record.status
      : fallback.status ?? SpatialConstraintStatus.UNKNOWN,
    source,
    evidence: optionalStringArray(record.evidence) ?? fallback.evidence,
  };
}

function compareSpatialConstraints(left: SpatialConstraint, right: SpatialConstraint): number {
  const leftCategory = CATEGORY_ORDER.indexOf(left.category);
  const rightCategory = CATEGORY_ORDER.indexOf(right.category);
  const categoryDelta = (leftCategory === -1 ? CATEGORY_ORDER.length : leftCategory) - (rightCategory === -1 ? CATEGORY_ORDER.length : rightCategory);

  if (categoryDelta !== 0) {
    return categoryDelta;
  }

  return left.label.localeCompare(right.label);
}

export function normalizeSpatialConstraints(value: unknown): SpatialConstraint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => normalizeSpatialConstraint(item, { id: `spatial-constraint-${index + 1}` }))
    .sort(compareSpatialConstraints);
}

export function mergeSpatialConstraints(
  current: unknown,
  patch: unknown,
): SpatialConstraint[] {
  const merged = new Map<string, SpatialConstraint>();

  for (const constraint of normalizeSpatialConstraints(current)) {
    merged.set(constraint.id, constraint);
  }

  if (!Array.isArray(patch)) {
    return [...merged.values()].sort(compareSpatialConstraints);
  }

  patch.forEach((rawPatch, index) => {
    const patchRecord = isRecord(rawPatch) ? rawPatch : {};
    const patchId = typeof patchRecord.id === "string" ? patchRecord.id : undefined;
    const previous = patchId ? merged.get(patchId) : undefined;
    const constraint = normalizeSpatialConstraint(
      rawPatch,
      previous ?? { id: patchId ?? `spatial-constraint-${index + 1}` },
    );

    merged.set(constraint.id, constraint);
  });

  return [...merged.values()].sort(compareSpatialConstraints);
}

export function normalizeSpatialConstraintMetadata<T extends SpatialConstraintMetadataInput>(
  metadata: T,
): Omit<T, "spatialConstraints" | "spatialConstraintsSource"> & SpatialConstraintMetadata {
  const spatialConstraints = normalizeSpatialConstraints(metadata.spatialConstraints);
  const firstSource = spatialConstraints[0]?.source.type;
  const metadataSource = isSpatialConstraintSource(metadata.spatialConstraintsSource)
    ? metadata.spatialConstraintsSource
    : undefined;

  return {
    ...metadata,
    spatialConstraints,
    spatialConstraintsLoadedAt: metadata.spatialConstraintsLoadedAt,
    spatialConstraintsSource: metadataSource ?? firstSource,
  };
}

export function mergeSpatialConstraintMetadata(
  current: SpatialConstraintMetadataInput,
  patch?: Partial<SpatialConstraintMetadataInput>,
): SpatialConstraintMetadata {
  const spatialConstraints = patch && "spatialConstraints" in patch
    ? mergeSpatialConstraints(current.spatialConstraints, patch.spatialConstraints)
    : normalizeSpatialConstraints(current.spatialConstraints);
  const firstSource = spatialConstraints[0]?.source.type;
  const currentSource = isSpatialConstraintSource(current.spatialConstraintsSource)
    ? current.spatialConstraintsSource
    : undefined;
  const patchSource = isSpatialConstraintSource(patch?.spatialConstraintsSource)
    ? patch.spatialConstraintsSource
    : undefined;

  return {
    ...current,
    ...patch,
    spatialConstraints,
    spatialConstraintsLoadedAt: patch?.spatialConstraintsLoadedAt ?? current.spatialConstraintsLoadedAt,
    spatialConstraintsSource: patchSource ?? currentSource ?? firstSource,
  };
}

export function buildFixtureSpatialConstraints(input: {
  address: string;
  council: string;
}): SpatialConstraint[] {
  const council = input.council.trim() || "Council";
  const source: SpatialConstraintSourceMetadata = {
    ...DEFAULT_SOURCE,
    label: `${council} planning fixture`,
  };

  return normalizeSpatialConstraints([
    {
      id: "fixture-zoning",
      category: SpatialConstraintCategory.ZONING,
      label: "Land zoning",
      value: "R2 Low Density Residential",
      description: `Fixture zoning for ${input.address}. Confirm against the current LEP before lodgement.`,
      severity: SpatialConstraintSeverity.INFO,
      status: SpatialConstraintStatus.CONFIRMED,
      source,
      evidence: [`${council} LEP land zoning layer fixture`],
    },
    {
      id: "fixture-height-limit",
      category: SpatialConstraintCategory.HEIGHT,
      label: "Maximum building height",
      value: "8.5 m",
      description: "Common residential height control used for advisory pre-checks.",
      severity: SpatialConstraintSeverity.MEDIUM,
      status: SpatialConstraintStatus.CONFIRMED,
      source,
      evidence: [`${council} height of buildings layer fixture`],
    },
    {
      id: "fixture-heritage",
      category: SpatialConstraintCategory.HERITAGE,
      label: "Heritage overlay",
      value: "No mapped heritage item in fixture",
      description: "Advisory only; check heritage schedules and nearby conservation areas.",
      severity: SpatialConstraintSeverity.LOW,
      status: SpatialConstraintStatus.NOT_TRIGGERED,
      source,
    },
    {
      id: "fixture-flood",
      category: SpatialConstraintCategory.FLOOD,
      label: "Flood planning area",
      value: "Overland flow review recommended",
      description: "Fixture flags a possible drainage/flood planning review for early risk triage.",
      severity: SpatialConstraintSeverity.MEDIUM,
      status: SpatialConstraintStatus.POTENTIAL,
      source,
    },
    {
      id: "fixture-bushfire",
      category: SpatialConstraintCategory.BUSHFIRE,
      label: "Bushfire prone land",
      value: "Not triggered in fixture",
      description: "No bushfire overlay is triggered by the deterministic fixture.",
      severity: SpatialConstraintSeverity.LOW,
      status: SpatialConstraintStatus.NOT_TRIGGERED,
      source,
    },
  ]);
}
