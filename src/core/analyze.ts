import { analyzePanel } from "@/core/compute";
import type { FileReport, Row } from "@/core/types";

type SheetInput = { id: string; fileName: string; rows: Row[] };

/**
 * Analyzes the rows of ONE spreadsheet. The two panels are independent: when one fails, the
 * other is still shown (status "partial").
 */
export function analyzeSheet({ id, fileName, rows }: SheetInput): FileReport {
  const panel1 = analyzePanel(rows, 1);
  const panel2 = analyzePanel(rows, 2);
  if (!panel1.ok && !panel2.ok) {
    return { id, fileName, status: "failed", errors: [...panel1.error, ...panel2.error] };
  }
  const status = panel1.ok && panel2.ok ? "ok" : "partial";
  return { id, fileName, status, panels: { 1: panel1, 2: panel2 } };
}
