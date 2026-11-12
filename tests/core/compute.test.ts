import { describe, expect, test } from 'vitest';
import { analyzePanel } from '../../src/core/compute';
import { analyzeSheet } from '../../src/core/analyze';
import { toMessage } from '../../src/core/errors';
import { formatPercent } from '../../src/core/format';
import type { PanelResult } from '../../src/core/types';
import { sampleRows, unwrap, withCells, withDuplicateAlive, withoutPanel } from '../helpers';

const marker = (r: PanelResult, name: string) => {
  const m = r.markers.find((x) => x.marker === name);
  if (!m) throw new Error(`marcador ${name} não encontrado`);
  return m;
};

describe('planilha de exemplo (fictícia, números conferidos à mão)', () => {
  const rows = sampleRows();

  test('panel 1: Alive = 10000 e marcadores positivos', () => {
    const r = unwrap(analyzePanel(rows, 1));
    expect(r.alive).toBe(10000);
    expect(r.aliveName).toBe('1.3 Exemplo panel 1_24h_exp1.mqd/Cells/Single Cells/Alive');
    expect(r.markers.map((m) => m.marker)).toEqual(['PerCP-Vio700-A', 'PE-A', 'PE-Vio770-A', 'APC-A', 'APC-Vio770-A']);

    expect(marker(r, 'PerCP-Vio700-A').cells).toBe(6000 + 1500); // Q1 + Q2
    expect(formatPercent(marker(r, 'PerCP-Vio700-A').fraction)).toBe(formatPercent(0.75));
    expect(marker(r, 'PE-A').cells).toBe(1500 + 500); // Q2 + Q3
    expect(marker(r, 'APC-A').cells).toBe(1200 + 4000); // Q6 + Q7
    expect(marker(r, 'APC-Vio770-A').cells).toBe(300 + 200); // Q10 + Q11
  });

  test('panel 1: PE-Vio770-A+ é a média dos dois grupos de quadrantes', () => {
    const m = marker(unwrap(analyzePanel(rows, 1)), 'PE-Vio770-A');
    expect(m.groups).toEqual([
      { group: 2, quadrants: [5, 6], cells: 800 + 1200 }, // 2000
      { group: 3, quadrants: [9, 10], cells: 1500 + 300 }, // 1800
    ]);
    expect(m.cells).toBe(1900);
    expect(m.fraction).toBeCloseTo(0.19, 10);
  });

  test('panel 2: Alive = 8000 e nenhum percentual passa de 100%', () => {
    const r = unwrap(analyzePanel(rows, 2));
    expect(r.alive).toBe(8000);
    expect(marker(r, 'PE-Vio770-A').cells).toBe(7900);
    expect(marker(r, 'APC-A').cells).toBe(7700);
    expect(marker(r, 'APC-Vio770-A').fraction).toBeCloseTo(0.1125, 10);
    for (const m of r.markers) {
      expect(m.fraction).toBeGreaterThanOrEqual(0);
      expect(m.fraction).toBeLessThanOrEqual(1);
    }
  });

  test('linhas de compensação, unstained e viobility são ignoradas', () => {
    expect(analyzeSheet('id', 'exemplo.xlsx', rows).status).toBe('ok');
  });
});

describe('erros por panel', () => {
  const rows = sampleRows();

  test('sem panel 2: mostra o panel 1 e o erro (parcial)', () => {
    const r = analyzeSheet('id', 'x.xls', withoutPanel(rows, 'panel 2_'));
    expect(r.status).toBe('partial');
    if (r.status === 'failed') throw new Error('não deveria falhar');
    expect(r.panels[1].ok).toBe(true);
    expect(r.panels[2]).toEqual({ ok: false, error: [{ code: 'MissingPanel', panel: 2 }] });
  });

  test('sem nenhum panel: falha com os dois erros', () => {
    const r = analyzeSheet('id', 'x.xls', withoutPanel(withoutPanel(rows, 'panel 1_'), 'panel 2_'));
    expect(r).toMatchObject({ status: 'failed', errors: [{ code: 'MissingPanel', panel: 1 }, { code: 'MissingPanel', panel: 2 }] });
  });

  test.each([
    ['Alive ausente', () => rows.filter((r) => !(r.name.includes('panel 1_') && r.name.endsWith('/Alive'))), 'MissingAliveRow'],
    ['Alive duplicado', () => withDuplicateAlive(rows, 'panel 1_'), 'DuplicateAliveRow'],
    ['Alive = 0', () => withCells(rows, 'panel 1_', '/Alive', 0), 'AliveZero'],
    ['Alive não numérico', () => withCells(rows, 'panel 1_', '/Alive', 'abc'), 'NonNumericCells'],
    ['quadrante não numérico', () => withCells(rows, 'panel 1_', 'PerCP-Vio700-A+', ''), 'NonNumericCells'],
    ['soma dos quadrantes ≠ Alive', () => withCells(rows, 'panel 1_', 'PE-A- , PerCP-Vio700-A-', 2001), 'QuadrantSumMismatch'],
    ['sem linhas de quadrante', () => rows.filter((r) => !(r.name.includes('panel 1_') && /\/Q\d+:/.test(r.name))), 'NoQuadrantRows'],
  ])('%s → panel 1 com %s, panel 2 continua OK', (_, build, code) => {
    const r = analyzeSheet('id', 'x.xls', build());
    expect(r.status).toBe('partial');
    if (r.status === 'failed') throw new Error('não deveria falhar');
    expect(r.panels[1].ok).toBe(false);
    if (!r.panels[1].ok) expect(r.panels[1].error[0].code).toBe(code);
    expect(r.panels[2].ok).toBe(true);
  });

  test('soma diferente informa o grupo e os valores', () => {
    const r = analyzePanel(withCells(rows, 'panel 1_', 'PE-A- , PerCP-Vio700-A-', 2001), 1);
    expect(r).toEqual({ ok: false, error: [{ code: 'QuadrantSumMismatch', panel: 1, group: 1, expected: 10000, actual: 10001 }] });
    if (!r.ok) expect(toMessage(r.error[0])).toBe('Panel 1: a soma dos quadrantes Q1–Q4 (10001) é diferente do total de Alive (10000).');
  });
});
