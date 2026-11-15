import type { SpreadsheetExt } from "@/adapters/sheetjs";
import { analyzeSheet } from "@/core/analyze";
import type { DomainError } from "@/core/errors";
import type { Result } from "@/core/result";
import { toRows } from "@/core/rows";
import type { FileReport, Grid } from "@/core/types";
import { ptBR } from "@/messages/pt-br";
import { cacheKey, type CachedResult, type ResultCache } from "@/services/cache";

export const MAX_FILES = 50;
export const ACCEPTED_EXTENSIONS: readonly SpreadsheetExt[] = ["xls", "xlsx", "csv"];

/** Spreadsheet reader. SheetJS in production; tests swap in a fake. */
export type GridReader = (
  bytes: Uint8Array,
  ext: SpreadsheetExt,
) => Result<Grid, DomainError> | Promise<Result<Grid, DomainError>>;

// SheetJS loads on the first upload only, so the page opens faster.
const sheetjsReader: GridReader = async (bytes, ext) =>
  (await import("@/adapters/sheetjs")).readGrid(bytes, ext);

/** The minimum we need from a file (the browser's File fits). */
export type InputFile = {
  name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type ProcessOptions = {
  /** Spreadsheet reader. Default: SheetJS. */
  read?: GridReader;
  /** Result cache. Without one, everything is recomputed. */
  cache?: ResultCache;
};

export const extensionOf = (fileName: string): string => {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
};

const isAccepted = (ext: string): ext is SpreadsheetExt =>
  (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);

let counter = 0;
const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `f${++counter}`;

const toCached = ({
  id: _id,
  fileName: _name,
  cached: _cached,
  ...rest
}: FileReport): CachedResult => rest;

type FileContext = { id: string; fileName: string };

const failed = ({ id, fileName }: FileContext, error: DomainError): FileReport => ({
  id,
  fileName,
  status: "failed",
  errors: [error],
});

async function compute(
  context: FileContext,
  bytes: Uint8Array,
  { ext, read }: { ext: SpreadsheetExt; read: GridReader },
): Promise<FileReport> {
  const grid = await read(bytes, ext);
  if (!grid.ok) return failed(context, grid.error);

  const rows = toRows(grid.value);
  if (!rows.ok) return failed(context, rows.error);

  return analyzeSheet({ ...context, rows: rows.value });
}

const causeOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function computeWithCache(
  context: FileContext,
  bytes: Uint8Array,
  { cache, ...reading }: { ext: SpreadsheetExt; read: GridReader; cache: ResultCache },
): Promise<FileReport> {
  // Without a fingerprint (crypto unavailable) the file is still computed, just not cached.
  const key = await cacheKey(bytes).catch(() => null);
  const hit = key ? cache.get(key) : undefined;
  if (hit) return { ...hit, ...context, cached: true } as FileReport;

  const report = await compute(context, bytes, reading);
  // Only deterministic results are stored: the same bytes always give the same report.
  if (key) cache.set(key, toCached(report));
  return report;
}

/**
 * Processes ONE file. Never rejects: any problem becomes a "failed" report, and the other files
 * in the batch are not affected.
 *
 * With a cache: when the SAME CONTENT was computed before (even under another file name), returns
 * the stored result with `cached: true`, without reading the spreadsheet again.
 */
export async function processFile(
  file: InputFile,
  { read = sheetjsReader, cache }: ProcessOptions = {},
): Promise<FileReport> {
  const context = { id: newId(), fileName: file.name };
  try {
    const ext = extensionOf(file.name);
    if (!isAccepted(ext)) return failed(context, { code: "UnsupportedFormat", ext });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!cache) return await compute(context, bytes, { ext, read });
    return await computeWithCache(context, bytes, { ext, read, cache });
  } catch (e) {
    // An unexpected error (a bug, a very odd file): only this file fails, and it is not cached.
    return failed(context, { code: "UnreadableFile", cause: causeOf(e) });
  }
}

/** The error message for the whole batch, or null when the batch is valid. */
export function validateBatch(files: readonly InputFile[]): string | null {
  if (files.length === 0) return ptBR.batch.empty;
  if (files.length > MAX_FILES) return ptBR.batch.tooMany(files.length, MAX_FILES);
  return null;
}

type BatchOptions = ProcessOptions & {
  onProgress?: (done: number, total: number, last: FileReport) => void;
};

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Processes the files one at a time, in the order received, reporting progress.
 * A file with an error neither stops nor changes the others.
 */
export async function processBatch(
  files: readonly InputFile[],
  { onProgress, ...options }: BatchOptions = {},
): Promise<FileReport[]> {
  const reports: FileReport[] = [];
  for (const [i, file] of files.entries()) {
    const report = await processFile(file, options);
    reports.push(report);
    onProgress?.(i + 1, files.length, report);
    // Lets the screen repaint between files.
    await nextTick();
  }
  return reports;
}
