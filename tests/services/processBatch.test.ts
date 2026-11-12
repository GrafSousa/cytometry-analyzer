import { describe, expect, test } from 'vitest';
import { err, ok } from '../../src/core/result';
import { processBatch, validateBatch, type GridReader, type InputFile } from '../../src/services/processBatch';
import { sampleGrid } from '../helpers';

// Arquivos falsos: o conteúdo é só um rótulo que o leitor falso entende.
const file = (name: string, label = 'good'): InputFile => ({
  name,
  arrayBuffer: async () => new TextEncoder().encode(label).buffer as ArrayBuffer,
});

const fakeReader: GridReader = (bytes) => {
  const label = new TextDecoder().decode(bytes);
  if (label === 'good') return ok(sampleGrid());
  if (label === 'corrupt') return err({ code: 'UnreadableFile', cause: 'arquivo corrompido' });
  if (label === 'crash') throw new Error('bug inesperado no leitor');
  if (label === 'no-header') return ok([['x', 'y']]);
  return ok([]);
};

describe('processBatch: um arquivo com erro não afeta os outros', () => {
  test('erros no meio do lote ficam isolados e a ordem é mantida', async () => {
    const files = [
      file('exp1.xls'),
      file('exp2.xls', 'corrupt'),
      file('exp3.xls', 'crash'),
      file('notas.txt'),
      file('exp4.csv', 'no-header'),
      file('exp5.xlsx'),
    ];
    const progress: number[] = [];
    const reports = await processBatch(files, { onProgress: (done) => progress.push(done), read: fakeReader });

    expect(reports.map((r) => [r.fileName, r.status])).toEqual([
      ['exp1.xls', 'ok'],
      ['exp2.xls', 'failed'],
      ['exp3.xls', 'failed'],
      ['notas.txt', 'failed'],
      ['exp4.csv', 'failed'],
      ['exp5.xlsx', 'ok'],
    ]);
    expect(reports.map((r) => (r.status === 'failed' ? r.errors[0].code : null))).toEqual([
      null,
      'UnreadableFile',
      'UnreadableFile',
      'UnsupportedFormat',
      'MissingColumns',
      null,
    ]);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('o resultado de um arquivo bom é igual com ou sem arquivos ruins no lote', async () => {
    const strip = <T extends { id: string }>(r: T) => ({ ...r, id: '' });
    const [alone] = await processBatch([file('exp1.xls')], { read: fakeReader });
    const mixed = await processBatch([file('ruim.xls', 'crash'), file('exp1.xls'), file('ruim2.xls', 'corrupt')], { read: fakeReader });
    expect(strip(mixed[1])).toEqual(strip(alone));
  });

  test('arquivos com o mesmo nome recebem ids diferentes', async () => {
    const reports = await processBatch([file('a.xls'), file('a.xls')], { read: fakeReader });
    expect(reports[0].id).not.toBe(reports[1].id);
  });
});

describe('validateBatch', () => {
  test('aceita de 1 a 50 arquivos', () => {
    expect(validateBatch([file('a.xls')])).toBeNull();
    expect(validateBatch(Array.from({ length: 50 }, (_, i) => file(`${i}.xls`)))).toBeNull();
  });
  test('recusa lote vazio ou com mais de 50', () => {
    expect(validateBatch([])).toBe('Nenhum arquivo selecionado.');
    expect(validateBatch(Array.from({ length: 51 }, (_, i) => file(`${i}.xls`)))).toBe(
      'Você selecionou 51 arquivos. O máximo é 50 por vez. Selecione menos arquivos e tente de novo.',
    );
  });
});
