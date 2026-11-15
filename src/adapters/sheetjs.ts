// The only file in the project that imports SheetJS ("xlsx").
import * as XLSX from "xlsx";

import type { DomainError } from "@/core/errors";
import { err, ok, type Result } from "@/core/result";
import type { Grid } from "@/core/types";

export type SpreadsheetExt = "xls" | "xlsx" | "csv";

const hasUtf8Bom = (bytes: Uint8Array) =>
  bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;

/** Decodes a CSV: drops the BOM, tries UTF-8 and falls back to Windows-1252 (older Excel). */
export function decodeCsv(bytes: Uint8Array): string {
  const body = hasUtf8Bom(bytes) ? bytes.subarray(3) : bytes;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return new TextDecoder("windows-1252").decode(body);
  }
}

const readWorkbook = (bytes: Uint8Array, ext: SpreadsheetExt) =>
  ext === "csv"
    ? XLSX.read(decodeCsv(bytes), { type: "string", raw: true })
    : XLSX.read(bytes, { type: "array" });

/** Reads the first sheet of the file and returns the raw grid. Never throws. */
export function readGrid(bytes: Uint8Array, ext: SpreadsheetExt): Result<Grid, DomainError> {
  if (bytes.length === 0) return err({ code: "EmptyFile" });
  try {
    const workbook = readWorkbook(bytes, ext);
    const firstName = workbook.SheetNames[0];
    const sheet = firstName ? workbook.Sheets[firstName] : undefined;
    if (!sheet) return err({ code: "UnreadableFile", cause: "nenhuma aba encontrada" });
    return ok(
      XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
        defval: null,
        blankrows: false,
      }),
    );
  } catch (e) {
    return err({ code: "UnreadableFile", cause: e instanceof Error ? e.message : String(e) });
  }
}
