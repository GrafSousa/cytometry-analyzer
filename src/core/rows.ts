import type { DomainError } from "@/core/errors";
import { err, ok, type Result } from "@/core/result";
import type { Grid, Row } from "@/core/types";

const NAME_HEADER = "Name";
const CELLS_HEADER = "#Cells";

/**
 * Parses #Cells as a non-negative integer.
 * Accepts a number or text ("8664", "8 664", "8.664", "8,664"; non-breaking spaces too). Empty or invalid → null, never 0.
 */
export function parseCount(value: unknown): number | null {
  if (typeof value === "number") return Number.isInteger(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const digits = value.replace(/\s/g, "");
  if (/^\d+$/.test(digits)) return Number(digits);
  if (/^\d{1,3}([.,]\d{3})+$/.test(digits)) return Number(digits.replace(/[.,]/g, ""));
  return null;
}

const cellText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isHeader = (row: unknown[]) =>
  Array.isArray(row) &&
  row.some((c) => cellText(c) === NAME_HEADER) &&
  row.some((c) => cellText(c) === CELLS_HEADER);

const hasName = (name: unknown): name is string => typeof name === "string" && name.trim() !== "";

/** Finds the Name / #Cells header and returns only the rows that have a name. */
export function toRows(grid: Grid): Result<Row[], DomainError> {
  const headerIndex = grid.findIndex(isHeader);
  if (headerIndex < 0)
    return err({ code: "MissingColumns", expected: [NAME_HEADER, CELLS_HEADER] });

  const header = grid[headerIndex].map(cellText);
  const nameColumn = header.indexOf(NAME_HEADER);
  const cellsColumn = header.indexOf(CELLS_HEADER);

  const rows: Row[] = [];
  grid.slice(headerIndex + 1).forEach((r, i) => {
    const name = r?.[nameColumn];
    if (!hasName(name)) return;
    const rawCells = r[cellsColumn];
    // +2: the grid is 0-based and starts at the header, the spreadsheet is 1-based.
    rows.push({
      line: headerIndex + i + 2,
      name: name.trim(),
      cells: parseCount(rawCells),
      rawCells,
    });
  });
  return ok(rows);
}
