import { APP } from '../config';
import { CALC_VERSION, type FileReport } from '../core/types';

/** O que fica guardado: o resultado do cálculo, sem id nem nome de arquivo. Nunca o conteúdo da planilha. */
export type CachedResult = FileReport extends infer R ? (R extends FileReport ? Omit<R, 'id' | 'fileName' | 'cached'> : never) : never;

export interface ResultCache {
  get(key: string): CachedResult | undefined;
  set(key: string, value: CachedResult): void;
  clear(): void;
  readonly size: number;
}

/** Impressão digital do conteúdo: SHA-256 dos bytes + versão das regras. O nome do arquivo não entra. */
export async function cacheKey(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `v${CALC_VERSION}:${hex}`;
}

/** Cache só em memória: vale enquanto a página estiver aberta. */
export function createMemoryCache(): ResultCache {
  const map = new Map<string, CachedResult>();
  return {
    get: (k) => map.get(k),
    set: (k, v) => void map.set(k, v),
    clear: () => map.clear(),
    get size() {
      return map.size;
    },
  };
}

/** Parte de Storage que usamos (localStorage atende; nos testes, um objeto falso). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface Entry {
  savedAt: number;
  value: CachedResult;
}

/**
 * Cache que sobrevive a recarregar a página, guardado no navegador (localStorage).
 * - Guarda até `maxEntries` resultados; ao passar disso, descarta os mais antigos.
 * - Qualquer falha do armazenamento (cheio, bloqueado, dado corrompido) é ignorada:
 *   o app só recalcula, nunca quebra por causa do cache.
 */
export function createPersistentCache(storage: KeyValueStorage, storageKey = `${APP.storagePrefix}:cache`, maxEntries = 500): ResultCache {
  const memory = new Map<string, Entry>();

  try {
    const raw = storage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
    for (const [k, e] of Object.entries(parsed)) {
      // Descarta entradas de versões antigas das regras ou malformadas.
      if (k.startsWith(`v${CALC_VERSION}:`) && e && typeof e.savedAt === 'number' && e.value && 'status' in e.value) memory.set(k, e);
    }
  } catch {
    // Dado corrompido: começa vazio.
  }

  const persist = () => {
    try {
      if (memory.size === 0) storage.removeItem(storageKey);
      else storage.setItem(storageKey, JSON.stringify(Object.fromEntries(memory)));
    } catch {
      // Armazenamento cheio ou indisponível: segue só em memória.
    }
  };

  return {
    get: (k) => memory.get(k)?.value,
    set(k, value) {
      memory.delete(k);
      memory.set(k, { savedAt: Date.now(), value });
      while (memory.size > maxEntries) memory.delete(memory.keys().next().value as string);
      persist();
    },
    clear() {
      memory.clear();
      persist();
    },
    get size() {
      return memory.size;
    },
  };
}

/** Cache do navegador quando disponível; senão, só em memória. */
export function createBrowserCache(): ResultCache {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return createPersistentCache(window.localStorage);
  } catch {
    // localStorage bloqueado (ex.: modo privado restrito).
  }
  return createMemoryCache();
}
