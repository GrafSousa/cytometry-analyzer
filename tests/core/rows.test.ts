import { describe, expect, test } from 'vitest';
import { parseCount, toRows } from '../../src/core/rows';

describe('parseCount', () => {
  test.each<[unknown, number | null]>([
    [8664, 8664],
    [0, 0],
    ['8664', 8664],
    [' 8664 ', 8664],
    ['8.664', 8664],
    ['8,664', 8664],
    ['8 664', 8664],
    ['8 664', 8664],
    ['', null],
    [null, null],
    ['abc', null],
    ['12,5', null],
    [-3, null],
    [12.5, null],
  ])('%j → %j', (input, expected) => {
    expect(parseCount(input)).toBe(expected);
  });
});

describe('toRows', () => {
  test('encontra o cabeçalho e guarda só Name e #Cells, com o número da linha original', () => {
    const r = toRows([
      ['Depth', 'Name', 'Statistic', '#Cells'],
      [null, 'a panel 1_x.mqd', null, 100],
      [null, null, null, null],
      ['> ', 'a panel 1_x.mqd/Cells', 80, '90'],
    ]);
    expect(r).toEqual({
      ok: true,
      value: [
        { line: 2, name: 'a panel 1_x.mqd', cells: 100, rawCells: 100 },
        { line: 4, name: 'a panel 1_x.mqd/Cells', cells: 90, rawCells: '90' },
      ],
    });
  });

  test('cabeçalho ausente gera MissingColumns', () => {
    expect(toRows([['A', 'B'], [1, 2]])).toEqual({ ok: false, error: { code: 'MissingColumns', expected: ['Name', '#Cells'] } });
  });
});
