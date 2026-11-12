/** Minúsculas e sem acentos: "Anotações" → "anotacoes". */
export const normalizeText = (s: string): string => s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();

/** Termos da busca, já normalizados. "  48h  Exp1 " → ["48h", "exp1"]. */
export const searchTerms = (query: string): string[] => normalizeText(query).split(/\s+/).filter(Boolean);

/** O nome contém TODOS os termos, em qualquer ordem, sem diferenciar maiúsculas nem acentos. */
export function matchesQuery(name: string, query: string): boolean {
  const n = normalizeText(name);
  return searchTerms(query).every((t) => n.includes(t));
}

/** Filtra mantendo a ordem original. Busca vazia devolve tudo. */
export function filterByName<T extends { fileName: string }>(items: readonly T[], query: string): T[] {
  return searchTerms(query).length === 0 ? [...items] : items.filter((it) => matchesQuery(it.fileName, query));
}

export interface Segment {
  text: string;
  match: boolean;
}

/**
 * Divide o nome em trechos para destacar o que casou com a busca.
 * highlight("BV2-48h-exp1.xls", "48h") → [{BV2-}, {48h, match}, {-exp1.xls}]
 */
export function highlight(name: string, query: string): Segment[] {
  const chars = Array.from(name);
  // Normaliza caractere a caractere para manter a posição de cada um no nome original.
  const norm = chars.map(normalizeText);
  const flat = norm.join('');
  const owner: number[] = [];
  norm.forEach((n, i) => {
    for (let k = 0; k < n.length; k++) owner.push(i);
  });

  const marked = new Array<boolean>(chars.length).fill(false);
  for (const t of searchTerms(query)) {
    for (let at = flat.indexOf(t); at >= 0; at = flat.indexOf(t, at + t.length)) {
      for (let k = at; k < at + t.length; k++) marked[owner[k]] = true;
    }
  }

  const out: Segment[] = [];
  chars.forEach((c, i) => {
    const last = out[out.length - 1];
    if (last && last.match === marked[i]) last.text += c;
    else out.push({ text: c, match: marked[i] });
  });
  return out;
}
