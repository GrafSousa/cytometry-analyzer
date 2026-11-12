import { describe, expect, test } from 'vitest';
import { isAlive, panelOf, parseQuadrant } from '../../src/core/naming';

describe('panelOf', () => {
  test.each([
    ['1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive', 1],
    ['1.4 BV2 panel 2_24h_exp1.mqd/Cells', 2],
    ['1.4 BV2 Panel 2_24h_exp1.mqd', 2],
    ['1.9 BV2 panel 10_24h_exp1.mqd/Cells', null],
    ['1.9 BV2 panel 12_24h_exp1.mqd/Cells', null],
    ['1.1 BV2 unstained_24h_exp1.mqd/Cells/Single Cells/Alive', null],
    ['1.2 BV2 viobility_24h_exp1.mqd/Cells/Single Cells/Alive', null],
    ['comp-miltenyi-beads_PE.fcs', null],
    ['xpanel 1_abc', null],
  ])('%s → %s', (name, expected) => {
    expect(panelOf(name)).toBe(expected);
  });
});

describe('isAlive', () => {
  test('aceita só a linha que termina em /Alive', () => {
    expect(isAlive('1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive')).toBe(true);
    expect(isAlive('1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive/Q1: PE-A- , PerCP-Vio700-A+')).toBe(false);
    expect(isAlive('1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells')).toBe(false);
  });
});

describe('parseQuadrant', () => {
  test('lê número, grupo e sinais dos marcadores', () => {
    expect(parseQuadrant('1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive/Q1: PE-A- , PerCP-Vio700-A+')).toEqual({
      q: 1,
      group: 1,
      markers: [
        { marker: 'PE-A', positive: false },
        { marker: 'PerCP-Vio700-A', positive: true },
      ],
    });
  });

  test.each([
    ['Q4', 1],
    ['Q5', 2],
    ['Q8', 2],
    ['Q9', 3],
    ['Q12', 3],
  ])('%s pertence ao grupo %i', (q, group) => {
    expect(parseQuadrant(`x panel 1_y/Alive/${q}: APC-A+ , PE-Vio770-A-`)?.group).toBe(group);
  });

  test('aceita sinal de menos Unicode e espaço não separável', () => {
    const r = parseQuadrant('x panel 1_y/Alive/Q2: PE-A− , PerCP-Vio700-A+');
    expect(r?.markers).toEqual([
      { marker: 'PE-A', positive: false },
      { marker: 'PerCP-Vio700-A', positive: true },
    ]);
  });

  test('rejeita quadrantes fora de Q1–Q12 e linhas que não são quadrante', () => {
    expect(parseQuadrant('x panel 1_y/Alive/Q13: PE-A+ , APC-A+')).toBeNull();
    expect(parseQuadrant('x panel 1_y/Alive')).toBeNull();
  });
});
