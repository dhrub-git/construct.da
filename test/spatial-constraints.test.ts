import { describe, expect, it } from "vitest";

import {
  buildFixtureSpatialConstraints,
  mergeSpatialConstraintMetadata,
  normalizeSpatialConstraintMetadata,
  normalizeSpatialConstraints,
  SpatialConstraintCategory,
  SpatialConstraintSeverity,
  SpatialConstraintSource,
  SpatialConstraintStatus,
} from "@/lib/spatial";

describe("spatial constraint helpers", () => {
  it("normalizes raw fixture constraints into stable contracts", () => {
    const constraints = normalizeSpatialConstraints([
      {
        id: "height-limit",
        category: SpatialConstraintCategory.HEIGHT,
        label: " Maximum building height ",
        value: " 8.5 m ",
        severity: SpatialConstraintSeverity.MEDIUM,
        status: SpatialConstraintStatus.CONFIRMED,
        source: {
          type: SpatialConstraintSource.FIXTURE,
          label: "Fixture layer",
          confidence: "high",
          retrievedAt: "2026-04-29T00:00:00.000Z",
        },
      },
    ]);

    expect(constraints).toEqual([
      expect.objectContaining({
        id: "height-limit",
        category: SpatialConstraintCategory.HEIGHT,
        label: "Maximum building height",
        value: "8.5 m",
        severity: SpatialConstraintSeverity.MEDIUM,
        status: SpatialConstraintStatus.CONFIRMED,
        source: expect.objectContaining({
          type: SpatialConstraintSource.FIXTURE,
          confidence: "high",
        }),
      }),
    ]);
  });

  it("defaults missing metadata to an empty spatial constraint list", () => {
    const metadata = normalizeSpatialConstraintMetadata({});

    expect(metadata.spatialConstraints).toEqual([]);
    expect(metadata.spatialConstraintsSource).toBeUndefined();
  });

  it("derives source from normalized constraints when metadata source is invalid", () => {
    const metadata = normalizeSpatialConstraintMetadata({
      spatialConstraints: buildFixtureSpatialConstraints({
        address: "1 Example Street",
        council: "Sample Council",
      }),
      spatialConstraintsSource: "stale-provider",
    });

    expect(metadata.spatialConstraintsSource).toBe(SpatialConstraintSource.FIXTURE);
  });

  it("merges metadata constraints by id while keeping deterministic ordering", () => {
    const current = {
      spatialConstraints: buildFixtureSpatialConstraints({
        address: "1 Example Street",
        council: "Sample Council",
      }),
      spatialConstraintsSource: SpatialConstraintSource.FIXTURE,
      spatialConstraintsLoadedAt: "2026-04-29T00:00:00.000Z",
    };

    const merged = mergeSpatialConstraintMetadata(current, {
      spatialConstraints: [
        {
          id: "fixture-height-limit",
          category: SpatialConstraintCategory.HEIGHT,
          label: "Maximum building height",
          value: "9 m",
          severity: SpatialConstraintSeverity.HIGH,
          status: SpatialConstraintStatus.POTENTIAL,
          source: {
            type: SpatialConstraintSource.MANUAL,
            label: "Planner override",
            confidence: "medium",
            retrievedAt: "2026-04-29T01:00:00.000Z",
          },
        },
      ],
      spatialConstraintsSource: SpatialConstraintSource.MANUAL,
      spatialConstraintsLoadedAt: "2026-04-29T01:00:00.000Z",
    });

    expect(merged.spatialConstraints).toHaveLength(5);
    expect(merged.spatialConstraints.map((constraint) => constraint.category).slice(0, 2)).toEqual([
      SpatialConstraintCategory.ZONING,
      SpatialConstraintCategory.HEIGHT,
    ]);
    expect(merged.spatialConstraints.find((constraint) => constraint.id === "fixture-height-limit")).toEqual(
      expect.objectContaining({
        value: "9 m",
        severity: SpatialConstraintSeverity.HIGH,
        source: expect.objectContaining({ type: SpatialConstraintSource.MANUAL }),
      }),
    );
    expect(merged.spatialConstraintsSource).toBe(SpatialConstraintSource.MANUAL);
    expect(merged.spatialConstraintsLoadedAt).toBe("2026-04-29T01:00:00.000Z");
  });

  it("preserves existing constraint fields when merging a partial patch", () => {
    const current = {
      spatialConstraints: buildFixtureSpatialConstraints({
        address: "1 Example Street",
        council: "Sample Council",
      }),
      spatialConstraintsSource: "stale-provider",
      spatialConstraintsLoadedAt: "2026-04-29T00:00:00.000Z",
    };

    const merged = mergeSpatialConstraintMetadata(current, {
      spatialConstraints: [
        {
          id: "fixture-height-limit",
          value: "9 m",
        },
      ],
    });

    const heightLimit = merged.spatialConstraints.find((constraint) => constraint.id === "fixture-height-limit");

    expect(heightLimit).toEqual(
      expect.objectContaining({
        category: SpatialConstraintCategory.HEIGHT,
        label: "Maximum building height",
        value: "9 m",
        severity: SpatialConstraintSeverity.MEDIUM,
        status: SpatialConstraintStatus.CONFIRMED,
        source: expect.objectContaining({
          type: SpatialConstraintSource.FIXTURE,
          label: "Sample Council planning fixture",
        }),
      }),
    );
    expect(merged.spatialConstraintsSource).toBe(SpatialConstraintSource.FIXTURE);
  });
});
