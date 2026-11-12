import { describe, expect, test } from 'vitest';
import { filterByName, highlight, matchesQuery, normalizeText, searchTerms } from '../../src/core/search';

const files = ['BV2-24h-exp1.xls', 'BV2-24h-exp2.xls', 'BV2-48h-exp1.xlsx', 'Microglia-72h-exp1.csv', 'Anotações finais.txt'].map((fileName, i) => ({
  id: String(i),
  fileName,
}));

describe('normalizeText e searchTerms', () => {
  test('remove acentos e maiúsculas', () => {
    expect(normalizeText('Anotações ÉXP')).toBe('anotacoes exp');
  });
  test('separa termos e ignora espaços extras', () => {
    expect(searchTerms('  48h   Exp1 ')).toEqual(['48h', 'exp1']);
    expect(searchTerms('   ')).toEqual([]);
  });
});

describe('matchesQuery', () => {
  test.each([
    ['BV2-48h-exp1.xlsx', '48h', true],
    ['BV2-48h-exp1.xlsx', '48H', true],
    ['BV2-48h-exp1.xlsx', 'exp1 48h', true], // ordem não importa
    ['BV2-48h-exp1.xlsx', '48h exp2', false], // todos os termos precisam aparecer
    ['Anotações finais.txt', 'anotacoes', true], // sem acento encontra com acento
    ['Anotacoes finais.txt', 'anotações', true], // e vice-versa
    ['BV2-24h-exp1.xls', '', true],
  ])('%s com "%s" → %s', (name, query, expected) => {
    expect(matchesQuery(name, query)).toBe(expected);
  });
});

describe('filterByName', () => {
  test('busca vazia devolve tudo, na mesma ordem', () => {
    expect(filterByName(files, '').map((f) => f.id)).toEqual(['0', '1', '2', '3', '4']);
  });
  test('filtra mantendo a ordem original', () => {
    expect(filterByName(files, 'exp1').map((f) => f.fileName)).toEqual(['BV2-24h-exp1.xls', 'BV2-48h-exp1.xlsx', 'Microglia-72h-exp1.csv']);
  });
  test('sem resultados', () => {
    expect(filterByName(files, '48h-exp9')).toEqual([]);
  });
});

describe('highlight', () => {
  test('marca o trecho encontrado', () => {
    expect(highlight('BV2-48h-exp1.xls', '48h')).toEqual([
      { text: 'BV2-', match: false },
      { text: '48h', match: true },
      { text: '-exp1.xls', match: false },
    ]);
  });
  test('marca vários termos e todas as ocorrências', () => {
    expect(highlight('exp1-exp1', 'exp1').filter((s) => s.match).map((s) => s.text)).toEqual(['exp1', 'exp1']);
    expect(highlight('BV2-48h-exp1.xls', 'exp1 bv2').filter((s) => s.match).map((s) => s.text)).toEqual(['BV2', 'exp1']);
  });
  test('destaca o texto original com acento', () => {
    expect(highlight('Anotações.txt', 'coes')).toEqual([
      { text: 'Anota', match: false },
      { text: 'ções', match: true },
      { text: '.txt', match: false },
    ]);
  });
  test('juntar os trechos devolve o nome original', () => {
    const name = 'Ação_ÉXP-1 (cópia).xls';
    expect(highlight(name, 'acao cop').map((s) => s.text).join('')).toBe(name);
  });
  test('busca vazia: um trecho só, sem destaque', () => {
    expect(highlight('abc.xls', '')).toEqual([{ text: 'abc.xls', match: false }]);
  });
});
