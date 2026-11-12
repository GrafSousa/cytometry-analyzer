// Único arquivo do projeto que importa a SheetJS ('xlsx').
import * as XLSX from 'xlsx';
import { ok, err, type Result } from '../core/result';
import type { DomainError } from '../core/errors';
import type { Grid } from '../core/types';

export type SpreadsheetExt = 'xls' | 'xlsx' | 'csv';

/** Decodifica CSV: remove BOM, tenta UTF-8 e, se falhar, usa Windows-1252 (Excel antigo). */
export function decodeCsv(bytes: Uint8Array): string {
  const b = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
  } catch {
    return new TextDecoder('windows-1252').decode(b);
  }
}

/** Lê a primeira aba do arquivo e devolve a grade crua. Nunca lança exceção. */
export function readGrid(bytes: Uint8Array, ext: SpreadsheetExt): Result<Grid, DomainError> {
  if (bytes.length === 0) return err({ code: 'EmptyFile' });
  try {
    const wb =
      ext === 'csv'
        ? XLSX.read(decodeCsv(bytes), { type: 'string', raw: true })
        : XLSX.read(bytes, { type: 'array' });
    const first = wb.SheetNames[0];
    const ws = first ? wb.Sheets[first] : undefined;
    if (!ws) return err({ code: 'UnreadableFile', cause: 'nenhuma aba encontrada' });
    return ok(XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null, blankrows: false }));
  } catch (e) {
    return err({ code: 'UnreadableFile', cause: e instanceof Error ? e.message : String(e) });
  }
}
