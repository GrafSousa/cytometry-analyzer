import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { toRows } from "@/core/rows";
import type { Grid, Row } from "@/core/types";

export const fixturePath = (relative: string) =>
  fileURLToPath(new URL(`./fixtures/${relative}`, import.meta.url));

export const EXAMPLE_XLSX = "example/example-24h-exp1.xlsx";

/** Grid of the FICTIONAL example spreadsheet (same content as the .xlsx, as JSON). See its README. */
export const sampleGrid = (): Grid =>
  JSON.parse(readFileSync(fixturePath("example/example-24h-exp1.grid.json"), "utf8"));

export function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) throw new Error(`Expected success, got: ${JSON.stringify(result.error)}`);
  return result.value;
}

export const sampleRows = (): Row[] => unwrap(toRows(sampleGrid()));

export const withoutPanel = (rows: Row[], panelText: string) =>
  rows.filter((r) => !r.name.includes(panelText));

type CellsChange = { panelText: string; suffix: string; value: unknown };

/** Replaces #Cells on the row whose name ends with `suffix`, inside the given panel. */
export function withCells(rows: Row[], { panelText, suffix, value }: CellsChange): Row[] {
  return rows.map((r) =>
    r.name.includes(panelText) && r.name.endsWith(suffix)
      ? { ...r, cells: typeof value === "number" ? value : null, rawCells: value }
      : r,
  );
}

export function withDuplicateAlive(rows: Row[], panelText: string): Row[] {
  const alive = rows.find((r) => r.name.includes(panelText) && r.name.endsWith("/Alive"));
  if (!alive) throw new Error(`No Alive row in ${panelText}`);
  return [...rows, { ...alive, line: 999 }];
}
