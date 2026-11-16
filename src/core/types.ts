import type { DomainError } from "@/core/errors";
import type { Result } from "@/core/result";

export type Panel = 1 | 2;
export const PANELS: readonly Panel[] = [1, 2];

/** Quadrant group: 1 = Q1–Q4, 2 = Q5–Q8, 3 = Q9–Q12. */
export type QuadGroup = 1 | 2 | 3;

/** Raw grid read from the spreadsheet (rows × columns). */
export type Grid = unknown[][];

/** A relevant spreadsheet row: only "Name" and "#Cells". */
export type Row = {
  /** Line number in the original spreadsheet (1 = first line), for error messages. */
  line: number;
  name: string;
  /** #Cells already parsed; null when the value is not a count. */
  cells: number | null;
  rawCells: unknown;
};

/** Sum of one positive marker inside one quadrant group. */
export type GroupSum = {
  group: QuadGroup;
  quadrants: number[];
  cells: number;
};

/** Result of one positive marker (for example "PE-A+"). */
export type MarkerResult = {
  /** Marker name without the sign, for example "PE-A". */
  marker: string;
  /** One entry per quadrant group the marker appears in. */
  groups: GroupSum[];
  /** Total cells. When the marker appears in more than one group, the mean of the group sums. */
  cells: number;
  /** cells / Alive (0 to 1). */
  fraction: number;
};

export type PanelResult = {
  panel: Panel;
  /** Name of the row used as 100%. */
  aliveName: string;
  alive: number;
  markers: MarkerResult[];
};

export type PanelOutcome = Result<PanelResult, DomainError[]>;

export type ReportStatus = "ok" | "partial" | "failed";

/**
 * Report of one file. Each file has its own, and one never affects another.
 * `cached: true` when the result came from the cache (the same content was computed before).
 */
export type FileReport = { id: string; fileName: string; cached?: boolean } & (
  | { status: "failed"; errors: DomainError[] }
  | { status: "ok" | "partial"; panels: Record<Panel, PanelOutcome> }
);

/**
 * Version of the calculation rules. It is part of the cache key: raise it whenever a rule in
 * src/core changes, so results computed with the old rules are dropped.
 */
export const CALC_VERSION = 1;
