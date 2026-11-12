import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import * as XLSX from 'xlsx';
import { decodeCsv, readGrid } from '../../src/adapters/sheetjs';
import { analyzeSheet } from '../../src/core/analyze';
import { toRows } from '../../src/core/rows';
import { fixturePath, sampleGrid, unwrap } from '../helpers';

const analyzeBytes = (bytes: Uint8Array, ext: 'xls' | 'xlsx' | 'csv') =>
  analyzeSheet('id', `arquivo.${ext}`, unwrap(toRows(unwrap(readGrid(bytes, ext)))));

describe('leitura com SheetJS', () => {
  test('lê a planilha de exemplo em .xlsx', () => {
    const bytes = new Uint8Array(readFileSync(fixturePath('exemplo/exemplo-24h-exp1.xlsx')));
    const r = analyzeBytes(bytes, 'xlsx');
    expect(r.status).toBe('ok');
    if (r.status === 'failed') return;
    expect(r.panels[1].ok && r.panels[1].value.alive).toBe(10000);
    expect(r.panels[2].ok && r.panels[2].value.alive).toBe(8000);
  });

  test.each(['xls', 'csv'] as const)('o mesmo conteúdo em .%s dá o mesmo resultado', (ext) => {
    const ws = XLSX.utils.aoa_to_sheet(sampleGrid());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet0');
    // .xls é gravado no formato BIFF8, o mesmo do MACSQuant.
    const bytes = new Uint8Array(XLSX.write(wb, { bookType: ext === 'xls' ? 'biff8' : ext, type: 'array' }));
    const fromXls = analyzeBytes(new Uint8Array(readFileSync(fixturePath('exemplo/exemplo-24h-exp1.xlsx'))), 'xlsx');
    const fromOther = analyzeBytes(bytes, ext);
    expect(fromOther.status).toBe('ok');
    if (fromOther.status !== 'failed' && fromXls.status !== 'failed') expect(fromOther.panels).toEqual(fromXls.panels);
  });

  test('arquivo vazio vira EmptyFile', () => {
    expect(readGrid(new Uint8Array(), 'xls')).toEqual({ ok: false, error: { code: 'EmptyFile' } });
  });

  test('bytes sem sentido nunca lançam exceção', () => {
    const junk = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5]); // começa como zip, mas está quebrado
    const r = readGrid(junk, 'xlsx');
    if (r.ok) expect(toRows(r.value).ok).toBe(false); // se a SheetJS "ler", o cabeçalho não existe
    else expect(r.error.code).toBe('UnreadableFile');
  });
});

describe('decodeCsv', () => {
  test('remove BOM e lê UTF-8', () => {
    expect(decodeCsv(new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0xc3, 0xa9]))).toBe('aé');
  });
  test('cai para Windows-1252 quando não é UTF-8', () => {
    expect(decodeCsv(new Uint8Array([0x61, 0xe9]))).toBe('aé');
  });
});
