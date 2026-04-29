import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { resolveProjectOwnership } from "@/lib/api/workflow-auth";
import { buildFixtureSpatialLayerResult, getSpatialConstraintsForPoint } from "@/lib/spatial";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type ProjectMetadataWithLocation = {
  geoEncoding?: {
    lat?: unknown;
    lng?: unknown;
  };
};

function asCoordinate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const ownership = await resolveProjectOwnership(projectId, userId);
  if (ownership.status === "missing") {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }
  if (ownership.status === "forbidden") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const metadata = ownership.project.metadata as ProjectMetadataWithLocation | null;
  const lat = asCoordinate(metadata?.geoEncoding?.lat);
  const lng = asCoordinate(metadata?.geoEncoding?.lng);
  const address = ownership.project.address;
  const council = ownership.project.council;

  if (lat === null || lng === null) {
    return NextResponse.json(buildFixtureSpatialLayerResult({ address, council }));
  }

  const result = await getSpatialConstraintsForPoint({
    point: { lat, lng },
    address,
    council,
  });

  return NextResponse.json(result);
}
