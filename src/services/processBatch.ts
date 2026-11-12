import { analyzeSheet } from '../core/analyze';
import type { DomainError } from '../core/errors';
import type { Result } from '../core/result';
import { toRows } from '../core/rows';
import type { FileReport, Grid } from '../core/types';
import type { SpreadsheetExt } from '../adapters/sheetjs';
import { cacheKey, type CachedResult, type ResultCache } from './cache';

export const MAX_FILES = 50;
export const ACCEPTED_EXTENSIONS: readonly SpreadsheetExt[] = ['xls', 'xlsx', 'csv'];

/** Leitor de planilha. Em produção é a SheetJS; nos testes pode ser trocado por um falso. */
export type GridReader = (bytes: Uint8Array, ext: SpreadsheetExt) => Result<Grid, DomainError> | Promise<Result<Grid, DomainError>>;

// A SheetJS é carregada só no primeiro upload, para a página abrir mais rápido.
const sheetjsReader: GridReader = async (bytes, ext) => (await import('../adapters/sheetjs')).readGrid(bytes, ext);

/** Arquivo mínimo de que precisamos (o File do navegador atende). */
export interface InputFile {
  name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface ProcessOptions {
  /** Leitor de planilhas. Padrão: SheetJS. */
  read?: GridReader;
  /** Cache de resultados. Sem cache, tudo é recalculado. */
  cache?: ResultCache;
}

export const extensionOf = (fileName: string): string => {
  const i = fileName.lastIndexOf('.');
  return i > 0 ? fileName.slice(i + 1).toLowerCase() : '';
};

const isAccepted = (ext: string): ext is SpreadsheetExt => (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);

let counter = 0;
const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `f${++counter}`);

const toCached = ({ id: _id, fileName: _name, cached: _c, ...rest }: FileReport): CachedResult => rest;

/**
 * Processa UM arquivo. Nunca rejeita: qualquer problema vira um relatório com status "failed",
 * e os outros arquivos do lote não são afetados.
 *
 * Com cache: se o MESMO CONTEÚDO já foi calculado (mesmo com outro nome de arquivo),
 * devolve o resultado guardado com `cached: true`, sem ler a planilha de novo.
 */
export async function processFile(file: InputFile, { read = sheetjsReader, cache }: ProcessOptions = {}): Promise<FileReport> {
  const id = newId();
  const fileName = file.name;
  try {
    const ext = extensionOf(fileName);
    if (!isAccepted(ext)) return { id, fileName, status: 'failed', errors: [{ code: 'UnsupportedFormat', ext }] };

    const bytes = new Uint8Array(await file.arrayBuffer());

    const key = cache ? await cacheKey(bytes).catch(() => null) : null;
    const hit = key ? cache?.get(key) : undefined;
    if (hit) return { ...hit, id, fileName, cached: true } as FileReport;

    const report = await compute(id, fileName, bytes, ext, read);
    // Só guarda resultados determinísticos: o mesmo arquivo daria sempre o mesmo resultado.
    if (key && cache) cache.set(key, toCached(report));
    return report;
  } catch (e) {
    // Erro inesperado (bug, arquivo muito estranho): só este arquivo falha, e não vai para o cache.
    return { id, fileName, status: 'failed', errors: [{ code: 'UnreadableFile', cause: e instanceof Error ? e.message : String(e) }] };
  }
}

async function compute(id: string, fileName: string, bytes: Uint8Array, ext: SpreadsheetExt, read: GridReader): Promise<FileReport> {
  const grid = await read(bytes, ext);
  if (!grid.ok) return { id, fileName, status: 'failed', errors: [grid.error] };

  const rows = toRows(grid.value);
  if (!rows.ok) return { id, fileName, status: 'failed', errors: [rows.error] };

  return analyzeSheet(id, fileName, rows.value);
}

/** Mensagem de erro do lote inteiro, ou null se o lote é válido. */
export function validateBatch(files: readonly InputFile[]): string | null {
  if (files.length === 0) return 'Nenhum arquivo selecionado.';
  if (files.length > MAX_FILES) return `Você selecionou ${files.length} arquivos. O máximo é ${MAX_FILES} por vez. Selecione menos arquivos e tente de novo.`;
  return null;
}

/**
 * Processa os arquivos um por vez, na ordem recebida, avisando o progresso.
 * Um arquivo com erro não interrompe nem altera os demais.
 */
export async function processBatch(
  files: readonly InputFile[],
  { onProgress, ...options }: ProcessOptions & { onProgress?: (done: number, total: number, last: FileReport) => void } = {},
): Promise<FileReport[]> {
  const reports: FileReport[] = [];
  for (const [i, file] of files.entries()) {
    const report = await processFile(file, options);
    reports.push(report);
    onProgress?.(i + 1, files.length, report);
    await new Promise((resolve) => setTimeout(resolve, 0)); // deixa a tela atualizar entre arquivos
  }
  return reports;
}
