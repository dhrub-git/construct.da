export type ViolationSeverity = "info" | "warning" | "error";

export type StreamingViolationBox = {
  id: string;
  fileId: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  coordinateSpace: "pdf-user-space";
  severity: ViolationSeverity;
  rule: string;
  title: string;
  message: string;
  evidence: string;
  delayMs: number;
};

export type ViolationStreamStatus = "idle" | "scanning" | "complete";

export type ViolationStreamState = {
  status: ViolationStreamStatus;
  visibleBoxes: StreamingViolationBox[];
  nextIndex: number;
  activeBoxId: string | null;
  startedAt: number | null;
  updatedAt: number | null;
  completedAt: number | null;
};

export type ViolationStreamAction =
  | { type: "start"; now: number }
  | { type: "reveal_next"; now: number; boxes: StreamingViolationBox[] }
  | { type: "reset" };

export const fixtureViolationStream: StreamingViolationBox[] = [
  {
    id: "height-plane-breach",
    fileId: "fixture-plan-a101",
    page: 1,
    x: 112,
    y: 516,
    w: 156,
    h: 70,
    coordinateSpace: "pdf-user-space",
    severity: "error",
    rule: "LEP cl. 4.3 Height of buildings",
    title: "Height plane breach",
    message: "Roof ridge is annotated at RL 45.2m, exceeding the 8.5m control by the deterministic demo fixture.",
    evidence: "A101 elevation note + height control fixture",
    delayMs: 420,
  },
  {
    id: "side-setback-warning",
    fileId: "fixture-plan-a101",
    page: 1,
    x: 356,
    y: 392,
    w: 110,
    h: 124,
    coordinateSpace: "pdf-user-space",
    severity: "warning",
    rule: "DCP side setback envelope",
    title: "Side setback needs verification",
    message: "Eastern wall sits inside the advisory setback band. Survey dimensions should be checked before lodgement.",
    evidence: "Ground floor plan fixture + DCP setback band",
    delayMs: 560,
  },
  {
    id: "shadow-diagram-gap",
    fileId: "fixture-plan-a102",
    page: 1,
    x: 206,
    y: 214,
    w: 174,
    h: 86,
    coordinateSpace: "pdf-user-space",
    severity: "warning",
    rule: "DCP solar access controls",
    title: "Shadow evidence incomplete",
    message: "Winter solstice shadow diagram is referenced in the report but not found in the uploaded drawing set.",
    evidence: "Report finding + missing drawing index fixture",
    delayMs: 680,
  },
  {
    id: "landscape-calculation-info",
    fileId: "fixture-plan-a103",
    page: 1,
    x: 452,
    y: 172,
    w: 92,
    h: 108,
    coordinateSpace: "pdf-user-space",
    severity: "info",
    rule: "DCP landscaped area schedule",
    title: "Landscape schedule extracted",
    message: "Deep soil and landscaped area values were captured for the assessment checklist.",
    evidence: "Landscape schedule fixture",
    delayMs: 520,
  },
];

export function createInitialViolationStreamState(): ViolationStreamState {
  return {
    status: "idle",
    visibleBoxes: [],
    nextIndex: 0,
    activeBoxId: null,
    startedAt: null,
    updatedAt: null,
    completedAt: null,
  };
}

export function violationStreamReducer(
  state: ViolationStreamState,
  action: ViolationStreamAction,
): ViolationStreamState {
  switch (action.type) {
    case "start":
      return {
        ...createInitialViolationStreamState(),
        status: "scanning",
        startedAt: action.now,
        updatedAt: action.now,
      };
    case "reveal_next": {
      if (state.status !== "scanning") {
        return state;
      }

      const nextBox = action.boxes[state.nextIndex];
      if (!nextBox) {
        return {
          ...state,
          status: "complete",
          activeBoxId: null,
          updatedAt: action.now,
          completedAt: action.now,
        };
      }

      const visibleBoxes = [...state.visibleBoxes, nextBox];
      const nextIndex = state.nextIndex + 1;
      const isComplete = nextIndex >= action.boxes.length;

      return {
        ...state,
        status: isComplete ? "complete" : "scanning",
        visibleBoxes,
        nextIndex,
        activeBoxId: nextBox.id,
        updatedAt: action.now,
        completedAt: isComplete ? action.now : null,
      };
    }
    case "reset":
      return createInitialViolationStreamState();
    default:
      return state;
  }
}

export function getNextViolationDelayMs(
  state: ViolationStreamState,
  boxes: StreamingViolationBox[],
): number | null {
  if (state.status !== "scanning") {
    return null;
  }

  return boxes[state.nextIndex]?.delayMs ?? 240;
}

export function getViolationStreamProgress(
  state: ViolationStreamState,
  totalBoxes: number,
): number {
  if (totalBoxes <= 0) {
    return 100;
  }

  return Math.round((state.visibleBoxes.length / totalBoxes) * 100);
}

export function getSeverityCounts(boxes: StreamingViolationBox[]): Record<ViolationSeverity, number> {
  return boxes.reduce<Record<ViolationSeverity, number>>(
    (counts, box) => ({
      ...counts,
      [box.severity]: counts[box.severity] + 1,
    }),
    { info: 0, warning: 0, error: 0 },
  );
}

export function getScanLineTopPercent(box: StreamingViolationBox | null): number {
  if (!box) {
    return 8;
  }

  const pageHeight = 720;
  const top = pageHeight - box.y - box.h;
  return Math.max(6, Math.min(92, Math.round((top / pageHeight) * 100)));
}
