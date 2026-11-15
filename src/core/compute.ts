import type { DomainError } from "@/core/errors";
import { isAlive, panelOf, parseQuadrant, type Quadrant } from "@/core/naming";
import { err, ok, type Result } from "@/core/result";
import type { GroupSum, MarkerResult, Panel, PanelOutcome, QuadGroup, Row } from "@/core/types";

/** Marker → quadrant group → sum. */
type MarkerSums = Map<string, Map<QuadGroup, GroupSum>>;

type QuadrantTotals = {
  groupTotals: Map<QuadGroup, number>;
  markerSums: MarkerSums;
  quadrantRows: number;
  errors: DomainError[];
};

/** The panel's Alive row and its count, which is the 100% of every percentage. */
function findAlive(rows: Row[], panel: Panel): Result<{ row: Row; cells: number }, DomainError[]> {
  const alives = rows.filter((r) => isAlive(r.name));
  if (alives.length === 0) return err([{ code: "MissingAliveRow", panel }]);
  if (alives.length > 1) {
    return err([{ code: "DuplicateAliveRow", panel, lines: alives.map((r) => r.line) }]);
  }
  const [row] = alives;
  if (row.cells === null) {
    return err([{ code: "NonNumericCells", panel, line: row.line, raw: row.rawCells }]);
  }
  if (row.cells === 0) return err([{ code: "AliveZero", panel }]);
  return ok({ row, cells: row.cells });
}

function addPositiveMarkers(sums: MarkerSums, quadrant: Quadrant, cells: number) {
  for (const { marker } of quadrant.markers.filter((m) => m.isPositive)) {
    const byGroup = sums.get(marker) ?? new Map<QuadGroup, GroupSum>();
    const sum = byGroup.get(quadrant.group) ?? { group: quadrant.group, quadrants: [], cells: 0 };
    sum.quadrants.push(quadrant.q);
    sum.cells += cells;
    byGroup.set(quadrant.group, sum);
    sums.set(marker, byGroup);
  }
}

function sumQuadrants(rows: Row[], panel: Panel): QuadrantTotals {
  const totals: QuadrantTotals = {
    groupTotals: new Map(),
    markerSums: new Map(),
    quadrantRows: 0,
    errors: [],
  };
  for (const row of rows) {
    const quadrant = parseQuadrant(row.name);
    if (!quadrant) continue;
    totals.quadrantRows++;
    if (row.cells === null) {
      totals.errors.push({ code: "NonNumericCells", panel, line: row.line, raw: row.rawCells });
      continue;
    }
    const group = quadrant.group;
    totals.groupTotals.set(group, (totals.groupTotals.get(group) ?? 0) + row.cells);
    addPositiveMarkers(totals.markerSums, quadrant, row.cells);
  }
  return totals;
}

// Each group of four quadrants splits the whole Alive population, so each must add up to it.
function checkGroupTotals(totals: Map<QuadGroup, number>, alive: number, panel: Panel) {
  return [...totals]
    .sort(([a], [b]) => a - b)
    .filter(([, total]) => total !== alive)
    .map(([group, total]): DomainError => ({
      code: "QuadrantSumMismatch",
      panel,
      group,
      expected: alive,
      actual: total,
    }));
}

function toMarkerResults(sums: MarkerSums, alive: number): MarkerResult[] {
  return [...sums].map(([marker, byGroup]) => {
    const groups = [...byGroup.values()].sort((a, b) => a.group - b.group);
    // A marker in more than one group (PE-Vio770-A+) counts as the mean of its group sums.
    const cells = groups.reduce((sum, g) => sum + g.cells, 0) / groups.length;
    return { marker, groups, cells, fraction: cells / alive };
  });
}

/**
 * Computes one panel of one spreadsheet: only "panel N_" rows, Alive as 100%, negative markers
 * ignored, each positive marker summed per quadrant group, % = total / Alive.
 */
export function analyzePanel(rows: Row[], panel: Panel): PanelOutcome {
  const panelRows = rows.filter((r) => panelOf(r.name) === panel);
  if (panelRows.length === 0) return err([{ code: "MissingPanel", panel }]);

  const alive = findAlive(panelRows, panel);
  if (!alive.ok) return alive;

  const totals = sumQuadrants(panelRows, panel);
  if (totals.quadrantRows === 0) return err([{ code: "NoQuadrantRows", panel }]);

  const errors = [
    ...totals.errors,
    ...checkGroupTotals(totals.groupTotals, alive.value.cells, panel),
  ];
  if (errors.length > 0) return err(errors);

  return ok({
    panel,
    aliveName: alive.value.row.name,
    alive: alive.value.cells,
    markers: toMarkerResults(totals.markerSums, alive.value.cells),
  });
}
