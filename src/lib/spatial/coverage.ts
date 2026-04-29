export const AustralianState = {
  NSW: "NSW",
  VIC: "VIC",
  QLD: "QLD",
  WA: "WA",
  SA: "SA",
  TAS: "TAS",
  NT: "NT",
  ACT: "ACT",
} as const;

export type AustralianState = (typeof AustralianState)[keyof typeof AustralianState];

export const Jurisdiction = {
  TOOWOOMBA: "Toowoomba Regional Council",
  MACKAY: "Mackay Regional Council",
} as const;

export type Jurisdiction = (typeof Jurisdiction)[keyof typeof Jurisdiction];

export interface BBBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export const JurisdictionCoords: Record<Jurisdiction, BBBox> = {
  [Jurisdiction.TOOWOOMBA]: {
    minLat: -28.192347,
    minLng: 150.702672,
    maxLat: -26.766807,
    maxLng: 152.251429,
  },
  [Jurisdiction.MACKAY]: {
    minLat: -22.40,
    minLng: 147.90,
    maxLat: -20.10,
    maxLng: 150.60,
  },
};


export const StateCoords: Record<AustralianState, BBBox> = {
  [AustralianState.ACT]: { minLat: -35.92, minLng: 148.76, maxLat: -35.12, maxLng: 149.40 },
  [AustralianState.TAS]: { minLat: -43.75, minLng: 144.40, maxLat: -39.20, maxLng: 148.50 },
  [AustralianState.VIC]: { minLat: -39.20, minLng: 140.90, maxLat: -33.90, maxLng: 150.00 },
  [AustralianState.NSW]: { minLat: -37.60, minLng: 140.99, maxLat: -28.15, maxLng: 153.64 },
  [AustralianState.QLD]: { minLat: -28.20, minLng: 138.00, maxLat: -10.00, maxLng: 153.64 },
  [AustralianState.SA]: { minLat: -38.10, minLng: 129.00, maxLat: -26.00, maxLng: 141.00 },
  [AustralianState.NT]: { minLat: -26.00, minLng: 129.00, maxLat: -10.00, maxLng: 138.00 },
  [AustralianState.WA]: { minLat: -35.20, minLng: 112.90, maxLat: -13.50, maxLng: 129.00 },
};

export function normalizeBBox(bbox: BBBox): BBBox {
  return {
    minLat: Math.min(bbox.minLat, bbox.maxLat),
    minLng: Math.min(bbox.minLng, bbox.maxLng),
    maxLat: Math.max(bbox.minLat, bbox.maxLat),
    maxLng: Math.max(bbox.minLng, bbox.maxLng),
  };
}

export function bboxesIntersect(left: BBBox, right: BBBox): boolean {
  const a = normalizeBBox(left);
  const b = normalizeBBox(right);

  return !(
    a.maxLng < b.minLng
    || a.minLng > b.maxLng
    || a.maxLat < b.minLat
    || a.minLat > b.maxLat
  );
}

export function coordToAUStates(view: BBBox): AustralianState[] {
  const normalizedView = normalizeBBox(view);
  const states = new Set<AustralianState>();

  for (const [state, bounds] of Object.entries(StateCoords) as [AustralianState, BBBox][]) {
    if (bboxesIntersect(normalizedView, bounds)) {
      states.add(state);
    }
  }

  return [...states];
}

export function coordsToJurisdictions(view: BBBox): Jurisdiction[] {
  const normalizedView = normalizeBBox(view);
  const jurisdictions: Jurisdiction[] = [];

  for (const [jurisdiction, bounds] of Object.entries(JurisdictionCoords) as [Jurisdiction, BBBox][]) {
    if (bboxesIntersect(normalizedView, bounds)) {
      jurisdictions.push(jurisdiction);
    }
  }

  return jurisdictions;
}

export function bboxAroundPoint(point: { lat: number; lng: number }, delta = 0.0001): BBBox {
  return {
    minLat: point.lat - delta,
    minLng: point.lng - delta,
    maxLat: point.lat + delta,
    maxLng: point.lng + delta,
  };
}
