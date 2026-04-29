import {
  SpatialConstraintCategory,
  SpatialConstraintSeverity,
  type SpatialConstraint,
} from "@/lib/spatial/constraints";
import {
  AustralianState,
  bboxAroundPoint,
  coordToAUStates,
  coordsToJurisdictions,
  type BBBox,
  type Jurisdiction,
} from "@/lib/spatial/coverage";
export const SpatialLayerType = {
  LAND_ZONES: "LAND_ZONES",
  FLOOD_HAZARD: "FLOOD_HAZARD",
  BUSHFIRE_HAZARD: "BUSHFIRE_HAZARD",
  HERITAGE_ZONES: "HERITAGE_ZONES",
} as const;

export type Layers = (typeof SpatialLayerType)[keyof typeof SpatialLayerType];

export type Styles = {
  label: string;
  idKey: string[];
  fillColor: string;
  groupName: string;
  strokeColor?: string;
};

export type LayerRegistry = {
  id: string;
  name: string;
  label: string;
  url: string;
  category: SpatialConstraint["category"];
  severity: SpatialConstraint["severity"];
  coverage: "state" | "lga";
  propertyKey: string[];
  labelKey: string;
  jurisdiction?: Jurisdiction;
  coverageBounds?: BBBox;
  whereClause?: string;
  enabled?: boolean;
};

type LayerInfo = Record<Layers, LayerRegistry | LayerRegistry[]>;

const layer = (config: Omit<LayerRegistry, "label">): LayerRegistry => ({
  ...config,
  label: config.name,
});

const NSW_LAYER_INFO: LayerInfo = {
  LAND_ZONES: layer({
    id: "NSW_LAND_ZONING",
    name: "NSW Land Zoning",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "SYM_CODE", "PURPOSE", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
  }),
  FLOOD_HAZARD: layer({
    id: "NSW_FLOOD_HAZARD",
    name: "NSW Flood Hazard",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Hazard/MapServer/1",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "COMMENT", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
  }),
  BUSHFIRE_HAZARD: layer({
    id: "NSW_BUSHFIRE_HAZARD",
    name: "NSW Bushfire Hazard",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Fire/NPWS_Fire_History/MapServer/0",
    category: SpatialConstraintCategory.BUSHFIRE,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "FireType", "FireName", "FireYear", "Label", "AreaHa"],
    labelKey: "FireType",
  }),
  HERITAGE_ZONES: layer({
    id: "NSW_HERITAGE_ZONES",
    name: "NSW Heritage Zones",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/0",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "H_ID", "H_NAME", "SIG", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
  }),
};

const QLD_LAYER_INFO: LayerInfo = {
  LAND_ZONES: [layer({
    id: "QLD_LAND_ZONING",
    name: "QLD Land Zoning",
    url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandUse/MapServer/0",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: ["objectid", "year", "qlump_code", "alum_code", "secondary", "tertiary", "primary_"],
    labelKey: "qlump_code",
  })],
  FLOOD_HAZARD: [layer({
    id: "QLD_FLOOD_HAZARD",
    name: "QLD Flood Hazard",
    url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Boundaries/AdminBoundariesFramework/MapServer/15",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["objectid", "sub_name", "sub_number", "qra_supply", "version", "currency"],
    labelKey: "sub_name",
  })],
  BUSHFIRE_HAZARD: [layer({
    id: "QLD_BUSHFIRE_HAZARD",
    name: "QLD Bushfire Hazard",
    url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Boundaries/AdminBoundariesFramework/MapServer/14",
    category: SpatialConstraintCategory.BUSHFIRE,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["objectid", "zone", "subzone", "frequency", "description", "status"],
    labelKey: "zone",
  })],
  HERITAGE_ZONES: layer({
    id: "QLD_HERITAGE_ZONES",
    name: "QLD Heritage Zones",
    url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Boundaries/AdminBoundariesFramework/MapServer/78",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: ["placename", "place_id", "entrydate", "status", "objectid"],
    labelKey: "placename",
  }),
};

const WA_LAYER_INFO: LayerInfo = {
  LAND_ZONES: layer({
    id: "WA_LAND_ZONING",
    name: "WA Land Zoning",
    url: "https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Property_and_Planning/MapServer/112",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: ["objectid", "zone", "label", "label_desc", "scheme_nam", "lga"],
    labelKey: "zone",
  }),
  FLOOD_HAZARD: layer({
    id: "WA_FLOOD_HAZARD",
    name: "WA Flood Hazard (Climate Projections)",
    url: "https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Water/MapServer/57",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["objectid", "event", "est_ari", "hyd_name", "location", "source"],
    labelKey: "hyd_name",
  }),
  BUSHFIRE_HAZARD: layer({
    id: "WA_BUSHFIRE_HAZARD",
    name: "WA Bushfire Prone Areas",
    url: "https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Bush_Fire_Prone_Areas/MapServer/17",
    category: SpatialConstraintCategory.BUSHFIRE,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["designation", "lga", "objectid", "type", "designationdate"],
    labelKey: "designation",
  }),
  HERITAGE_ZONES: layer({
    id: "WA_HERITAGE_ZONES",
    name: "WA Heritage Register",
    url: "https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/People_and_Society/MapServer/16",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: ["objectid", "place_no", "place_name", "location", "lga", "more_info"],
    labelKey: "place_name",
  }),
};

const SA_LAYER_INFO: LayerInfo = {
  LAND_ZONES: layer({
    id: "SA_LAND_ZONING",
    name: "SA Land Zoning",
    url: "https://location.sa.gov.au/server6/rest/services/ePlanningPublic/CurrentPDC_wmas/MapServer/114",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: ["objectid", "id", "name", "description", "value", "status"],
    labelKey: "name",
  }),
  FLOOD_HAZARD: layer({
    id: "SA_FLOOD_HAZARD",
    name: "SA Flood Hazard Zones",
    url: "https://location.sa.gov.au/server6/rest/services/ePlanningPublic/ConsultFlooding/MapServer/7",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["objectid", "id", "name", "description", "value", "status"],
    labelKey: "name",
  }),
  BUSHFIRE_HAZARD: [
    layer({
      id: "SA_BUSHFIRE_HAZARD_HIGH_RISK",
      name: "SA Bushfire Hazard Zones - High Risk Areas",
      url: "https://location.sa.gov.au/server6/rest/services/ePlanningPublic/CurrentPDC_wmas/MapServer/10",
      category: SpatialConstraintCategory.BUSHFIRE,
      severity: SpatialConstraintSeverity.HIGH,
      coverage: "state",
      propertyKey: ["objectid", "id", "name", "description", "value", "status"],
      labelKey: "name",
    }),
  ],
  HERITAGE_ZONES: layer({
    id: "SA_HERITAGE_ZONES",
    name: "SA Heritage Zones",
    url: "https://location.sa.gov.au/server6/rest/services/ePlanningPublic/CurrentPDC_wmas/MapServer/23",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: ["objectid", "id", "name", "description", "value", "status"],
    labelKey: "name",
  }),
};

const ACT_LAYER_INFO: LayerInfo = {
  LAND_ZONES: layer({
    id: "ACT_LAND_ZONING",
    name: "ACT Land Use Zones",
    url: "https://services1.arcgis.com/E5n4f1VY84i0xSjy/ArcGIS/rest/services/ACTGOV_TP_LAND_USE_ZONE/FeatureServer/1",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: ["OBJECTID", "DESCRIPTION", "LAND_USE_ZONE_CODE_ID", "LAND_USE_POLICY_DESC", "DIVISION_NAME", "DISTRICT_NAME"],
    labelKey: "LAND_USE_ZONE_CODE_ID",
  }),
  FLOOD_HAZARD: layer({
    id: "ACT_FLOOD_HAZARD",
    name: "ACT Flood Extent",
    url: "https://services1.arcgis.com/E5n4f1VY84i0xSjy/ArcGIS/rest/services/ACTGOV_FLOOD_EXTENT/FeatureServer/0",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "FLOOD_TYPE", "FLOOD_ZONE", "DESCRIPTION", "GlobalID"],
    labelKey: "FLOOD_ZONE",
  }),
  BUSHFIRE_HAZARD: layer({
    id: "ACT_BUSHFIRE_HAZARD",
    name: "ACT Fire Management Zones",
    url: "https://services1.arcgis.com/E5n4f1VY84i0xSjy/ArcGIS/rest/services/Fire_Management_Zones_2015_2019/FeatureServer/0",
    category: SpatialConstraintCategory.BUSHFIRE,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "ID", "ELEM_TEXT", "DESC_", "Hectare"],
    labelKey: "ELEM_TEXT",
  }),
  HERITAGE_ZONES: layer({
    id: "ACT_HERITAGE_ZONES",
    name: "ACT Heritage Register",
    url: "https://services1.arcgis.com/E5n4f1VY84i0xSjy/ArcGIS/rest/services/ACTGOV_Heritage_Register/FeatureServer/1",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: ["OBJECTID", "NAME", "SITE_NAME", "HRcategory", "HeritageID", "HRstatus"],
    labelKey: "NAME",
  }),
};

const VIC_ZONE_FIELDS = ["OBJECTID", "PFI", "SCHEME_CODE", "LGA_CODE", "LGA", "ZONE_CODE", "ZONE_DESCRIPTION", "ZONE_CODE_GROUP_LABEL"];

const VIC_LAYER_INFO: LayerInfo = {
  LAND_ZONES: [
    [3, "LOW_DENSITY_RESIDENTIAL", "Low Density Residential"],
    [4, "MIXED_USE", "Mixed Use Zone"],
    [5, "TOWNSHIP", "Township Zone"],
    [6, "RESIDENTIAL_GROWTH", "Residential Growth Zone"],
    [7, "NEIGHBOURHOOD_RESIDENTIAL", "Neighbourhood Residential Zone"],
    [8, "GENERAL_RESIDENTIAL", "General Residential Zone"],
  ].map(([layerId, id, name]) => layer({
    id: `VIC_LAND_ZONING_${id}`,
    name: `VIC Land Zoning - ${name}`,
    url: `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/${layerId}`,
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    coverage: "state",
    propertyKey: VIC_ZONE_FIELDS,
    labelKey: "ZONE_CODE_GROUP_LABEL",
  })),
  FLOOD_HAZARD: layer({
    id: "VIC_FLOOD_HAZARD",
    name: "VIC Flood Hazard",
    url: "https://emapdev.ffm.vic.gov.au/arcgis/rest/services/Victorian_Flood_Database/MapServer/13",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "HEIGHT", "STUDYID", "ARI", "METHOD", "RELIABILITY", "TYPE"],
    labelKey: "METHOD",
  }),
  BUSHFIRE_HAZARD: layer({
    id: "VIC_BUSHFIRE_HAZARD",
    name: "VIC Bushfire Hazard",
    url: "https://emapdev.ffm.vic.gov.au/arcgis/rest/services/vsw_fire_management/MapServer/47",
    category: SpatialConstraintCategory.BUSHFIRE,
    severity: SpatialConstraintSeverity.MEDIUM,
    coverage: "state",
    propertyKey: ["OBJECTID", "FIRETYPE", "SEASON", "FIRE_NO", "NAME", "START_DATE", "AREA_HA"],
    labelKey: "NAME",
  }),
  HERITAGE_ZONES: layer({
    id: "VIC_HERITAGE_ZONES",
    name: "VIC Heritage Zones",
    url: "https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeOverlays/MapServer/9",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    coverage: "state",
    propertyKey: VIC_ZONE_FIELDS,
    labelKey: "SCHEME_CODE",
  }),
};

export const stateLayerMapping: Partial<Record<AustralianState, LayerInfo>> = {
  [AustralianState.NSW]: NSW_LAYER_INFO,
  [AustralianState.VIC]: VIC_LAYER_INFO,
  [AustralianState.QLD]: QLD_LAYER_INFO,
  [AustralianState.WA]: WA_LAYER_INFO,
  [AustralianState.SA]: SA_LAYER_INFO,
  [AustralianState.ACT]: ACT_LAYER_INFO,
};

export const DEFAULT_SPATIAL_LAYER_TYPES: Layers[] = [
  SpatialLayerType.LAND_ZONES,
  SpatialLayerType.FLOOD_HAZARD,
  SpatialLayerType.BUSHFIRE_HAZARD,
  SpatialLayerType.HERITAGE_ZONES,
];

export const LayerInfoLabelNames: Record<Layers, string[]> = {
  LAND_ZONES: ["LAY_CLASS", "tertiary", "zone", "LAND_USE_ZONE_CODE_ID", "ZONE_CODE_GROUP_LABEL"],
  FLOOD_HAZARD: ["LAY_CLASS", "sub_name", "hyd_name", "FLOOD_ZONE", "METHOD"],
  BUSHFIRE_HAZARD: ["zone", "FireType", "designation", "ELEM_TEXT", "NAME"],
  HERITAGE_ZONES: ["LAY_CLASS", "placename", "place_name", "NAME", "SCHEME_CODE"],
};

function isLayerInView(layerInfo: LayerRegistry, lgasInView: Jurisdiction[]): boolean {
  if (layerInfo.enabled === false) {
    return false;
  }

  return layerInfo.coverage === "state"
    || Boolean(layerInfo.jurisdiction && lgasInView.includes(layerInfo.jurisdiction));
}

export function getLayersForView(view: BBBox, layerType: Layers): LayerRegistry[] {
  const statesInView = coordToAUStates(view);
  const lgasInView = coordsToJurisdictions(view);
  const layers = new Map<string, LayerRegistry>();

  for (const state of statesInView) {
    const layerInfo = stateLayerMapping[state]?.[layerType];
    if (!layerInfo) {
      continue;
    }
    const layerItems = Array.isArray(layerInfo) ? layerInfo : [layerInfo];

    for (const layerItem of layerItems) {
      if (isLayerInView(layerItem, lgasInView)) {
        layers.set(layerItem.id, layerItem);
      }
    }
  }

  return [...layers.values()];
}

export function getLayersForPoint(
  point: { lat: number; lng: number },
  layerTypes: Layers[] = DEFAULT_SPATIAL_LAYER_TYPES,
): LayerRegistry[] {
  const view = bboxAroundPoint(point);
  const layers = new Map<string, LayerRegistry>();

  for (const layerType of layerTypes) {
    for (const layerInfo of getLayersForView(view, layerType)) {
      layers.set(layerInfo.id, layerInfo);
    }
  }

  return [...layers.values()];
}
