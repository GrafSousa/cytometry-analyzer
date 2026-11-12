import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toRows } from '../src/core/rows';
import type { Grid, Row } from '../src/core/types';

export const fixturePath = (rel: string) => fileURLToPath(new URL(`./fixtures/${rel}`, import.meta.url));

/** Grade da planilha de exemplo FICTÍCIA (mesmo conteúdo do .xlsx, em JSON). Ver tests/fixtures/exemplo/README.md. */
export const sampleGrid = (): Grid => JSON.parse(readFileSync(fixturePath('exemplo/exemplo-24h-exp1.grid.json'), 'utf8'));

export function unwrap<T>(r: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!r.ok) throw new Error(`Esperava sucesso, veio erro: ${JSON.stringify(r.error)}`);
  return r.value;
}

export const sampleRows = (): Row[] => unwrap(toRows(sampleGrid()));

// --- Variações da planilha real para testar erros ---------------------------------

export const withoutPanel = (rows: Row[], panelText: string) => rows.filter((r) => !r.name.includes(panelText));

/** Troca o #Cells da linha cujo nome termina com `suffix` dentro do panel indicado. */
export function withCells(rows: Row[], panelText: string, suffix: string, value: unknown): Row[] {
  return rows.map((r) =>
    r.name.includes(panelText) && r.name.endsWith(suffix)
      ? { ...r, cells: typeof value === 'number' ? value : null, rawCells: value }
      : r,
  );
}

export function withDuplicateAlive(rows: Row[], panelText: string): Row[] {
  const alive = rows.find((r) => r.name.includes(panelText) && r.name.endsWith('/Alive'))!;
  return [...rows, { ...alive, line: 999 }];
}
