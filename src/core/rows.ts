import { ok, err, type Result } from './result';
import type { DomainError } from './errors';
import type { Grid, Row } from './types';

/**
 * Converte o valor de #Cells em inteiro não negativo.
 * Aceita número ou texto ("8664", "8 664", "8.664", "8,664"). Vazio ou inválido → null (nunca vira 0).
 */
export function parseCount(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\s  ]/g, '');
  if (/^\d+$/.test(s)) return Number(s);
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''));
  return null;
}

const cellText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Encontra o cabeçalho (Name / #Cells) e devolve só as linhas com nome. */
export function toRows(grid: Grid): Result<Row[], DomainError> {
  const h = grid.findIndex((r) => Array.isArray(r) && r.some((c) => cellText(c) === 'Name') && r.some((c) => cellText(c) === '#Cells'));
  if (h < 0) return err({ code: 'MissingColumns', expected: ['Name', '#Cells'] });

  const header = grid[h].map(cellText);
  const iName = header.indexOf('Name');
  const iCells = header.indexOf('#Cells');

  const rows: Row[] = [];
  grid.slice(h + 1).forEach((r, i) => {
    const name = r?.[iName];
    if (typeof name !== 'string' || name.trim() === '') return;
    rows.push({ line: h + i + 2, name: name.trim(), cells: parseCount(r[iCells]), rawCells: r[iCells] });
  });
  return ok(rows);
}
