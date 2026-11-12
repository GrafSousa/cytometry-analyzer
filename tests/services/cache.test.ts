import { describe, expect, test } from 'vitest';
import { ok } from '../../src/core/result';
import { CALC_VERSION } from '../../src/core/types';
import { cacheKey, createMemoryCache, createPersistentCache, type KeyValueStorage } from '../../src/services/cache';
import { processBatch, type GridReader, type InputFile } from '../../src/services/processBatch';
import { sampleGrid } from '../helpers';

const file = (name: string, content = 'conteúdo A'): InputFile => ({
  name,
  arrayBuffer: async () => new TextEncoder().encode(content).buffer as ArrayBuffer,
});

/** Leitor falso que conta quantas vezes foi chamado. */
function countingReader() {
  const calls: string[] = [];
  const read: GridReader = (bytes) => {
    calls.push(new TextDecoder().decode(bytes));
    return ok(sampleGrid());
  };
  return { read, calls };
}

function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('cacheKey', () => {
  test('mesmo conteúdo → mesma chave; conteúdo diferente → chave diferente', async () => {
    const a = await cacheKey(new TextEncoder().encode('abc'));
    expect(a).toBe(await cacheKey(new TextEncoder().encode('abc')));
    expect(a).not.toBe(await cacheKey(new TextEncoder().encode('abd')));
  });

  test('inclui a versão das regras', async () => {
    const k = await cacheKey(new TextEncoder().encode('abc'));
    expect(k.startsWith(`v${CALC_VERSION}:`)).toBe(true);
    expect(k).toBe(`v${CALC_VERSION}:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`);
  });
});

describe('processBatch com cache', () => {
  test('o mesmo conteúdo, mesmo com outro nome, não é recalculado', async () => {
    const cache = createMemoryCache();
    const { read, calls } = countingReader();

    const first = await processBatch([file('exp1.xls')], { read, cache });
    const second = await processBatch([file('exp1 (cópia).xls'), file('exp2.xls', 'conteúdo B')], { read, cache });

    expect(calls).toEqual(['conteúdo A', 'conteúdo B']); // exp1 (cópia) não foi lido de novo
    expect(first[0].cached).toBe(undefined);
    expect(second[0].cached).toBe(true);
    expect(second[0].fileName).toBe('exp1 (cópia).xls'); // mantém o nome do arquivo enviado agora
    expect(second[0].id).not.toBe(first[0].id);
    expect(second[1].cached).toBe(undefined);

    const strip = ({ id: _i, fileName: _f, cached: _c, ...rest }: (typeof first)[number]) => rest;
    expect(strip(second[0])).toEqual(strip(first[0])); // resultado idêntico
  });

  test('arquivos repetidos no mesmo lote: o segundo vem do cache', async () => {
    const { read, calls } = countingReader();
    const reports = await processBatch([file('a.xls'), file('b.xls')], { read, cache: createMemoryCache() });
    expect(calls).toHaveLength(1);
    expect(reports.map((r) => r.cached ?? false)).toEqual([false, true]);
  });

  test('erro inesperado do leitor não vai para o cache', async () => {
    const cache = createMemoryCache();
    let fail = true;
    const read: GridReader = () => {
      if (fail) throw new Error('falha temporária');
      return ok(sampleGrid());
    };
    const [a] = await processBatch([file('x.xls')], { read, cache });
    expect(a.status).toBe('failed');
    expect(cache.size).toBe(0);
    fail = false;
    const [b] = await processBatch([file('x.xls')], { read, cache });
    expect(b.status).toBe('ok');
    expect(b.cached).toBe(undefined);
  });

  test('sem cache, tudo é recalculado', async () => {
    const { read, calls } = countingReader();
    await processBatch([file('a.xls'), file('a.xls')], { read });
    expect(calls).toHaveLength(2);
  });
});

describe('createPersistentCache', () => {
  test('sobrevive a recarregar a página', async () => {
    const storage = fakeStorage();
    const { read, calls } = countingReader();
    await processBatch([file('exp1.xls')], { read, cache: createPersistentCache(storage) });

    const afterReload = createPersistentCache(storage);
    const [r] = await processBatch([file('exp1.xls')], { read, cache: afterReload });
    expect(calls).toHaveLength(1);
    expect(r.cached).toBe(true);
  });

  test('clear apaga tudo, inclusive no armazenamento', () => {
    const storage = fakeStorage();
    const cache = createPersistentCache(storage);
    cache.set(`v${CALC_VERSION}:aa`, { status: 'failed', errors: [{ code: 'EmptyFile' }] });
    expect(storage.data.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(storage.data.size).toBe(0);
  });

  test('descarta os mais antigos acima do limite', () => {
    const cache = createPersistentCache(fakeStorage(), 'k', 2);
    const v = { status: 'failed' as const, errors: [{ code: 'EmptyFile' as const }] };
    cache.set('v1:a', v);
    cache.set('v1:b', v);
    cache.set('v1:c', v);
    expect(cache.size).toBe(2);
    expect(cache.get('v1:a')).toBe(undefined);
    expect(cache.get('v1:c')).toEqual(v);
  });

  test('dado corrompido ou de versão antiga é ignorado', () => {
    const storage = fakeStorage();
    storage.setItem('planilhas-anna:cache', '{não é json');
    expect(createPersistentCache(storage).size).toBe(0);

    storage.setItem('planilhas-anna:cache', JSON.stringify({ 'v0:abc': { savedAt: 1, value: { status: 'ok', panels: {} } } }));
    expect(createPersistentCache(storage).size).toBe(0);
  });

  test('armazenamento cheio não quebra: segue em memória', () => {
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    const cache = createPersistentCache(storage);
    cache.set('v1:a', { status: 'failed', errors: [{ code: 'EmptyFile' }] });
    expect(cache.size).toBe(1);
  });
});
