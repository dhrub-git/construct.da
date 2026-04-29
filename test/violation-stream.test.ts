import { describe, expect, it } from "vitest";

import {
  createInitialViolationStreamState,
  fixtureViolationStream,
  getNextViolationDelayMs,
  getScanLineTopPercent,
  getSeverityCounts,
  getViolationStreamProgress,
  violationStreamReducer,
} from "@/lib/extraction/violation-stream";

describe("violation stream reducer", () => {
  it("starts from a deterministic idle state", () => {
    const state = createInitialViolationStreamState();

    expect(state).toMatchObject({
      status: "idle",
      visibleBoxes: [],
      nextIndex: 0,
      activeBoxId: null,
      completedAt: null,
    });
  });

  it("reveals fixture boxes in order and records progress", () => {
    const started = violationStreamReducer(createInitialViolationStreamState(), {
      type: "start",
      now: 100,
    });

    const first = violationStreamReducer(started, {
      type: "reveal_next",
      now: 520,
      boxes: fixtureViolationStream,
    });

    const second = violationStreamReducer(first, {
      type: "reveal_next",
      now: 1080,
      boxes: fixtureViolationStream,
    });

    expect(first.status).toBe("scanning");
    expect(first.visibleBoxes.map((box) => box.id)).toEqual(["height-plane-breach"]);
    expect(first.activeBoxId).toBe("height-plane-breach");
    expect(second.visibleBoxes.map((box) => box.id)).toEqual([
      "height-plane-breach",
      "side-setback-warning",
    ]);
    expect(getViolationStreamProgress(second, fixtureViolationStream.length)).toBe(50);
    expect(getNextViolationDelayMs(second, fixtureViolationStream)).toBe(fixtureViolationStream[2].delayMs);
  });

  it("completes when the final box is revealed and remains stable after completion", () => {
    const complete = fixtureViolationStream.reduce(
      (state, _box, index) => violationStreamReducer(state, {
        type: "reveal_next",
        now: 200 + index,
        boxes: fixtureViolationStream,
      }),
      violationStreamReducer(createInitialViolationStreamState(), { type: "start", now: 100 }),
    );

    const unchanged = violationStreamReducer(complete, {
      type: "reveal_next",
      now: 999,
      boxes: fixtureViolationStream,
    });

    expect(complete.status).toBe("complete");
    expect(complete.visibleBoxes).toHaveLength(fixtureViolationStream.length);
    expect(complete.completedAt).toBe(203);
    expect(unchanged).toBe(complete);
  });

  it("derives issue counts and scan-line target positions", () => {
    const counts = getSeverityCounts(fixtureViolationStream);

    expect(counts).toEqual({ error: 1, warning: 2, info: 1 });
    expect(getScanLineTopPercent(null)).toBe(8);
    expect(getScanLineTopPercent(fixtureViolationStream[0])).toBeGreaterThan(1);
  });
});
