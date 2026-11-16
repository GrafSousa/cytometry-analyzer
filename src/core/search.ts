/** Lowercase and without accents: "Anotações" → "anotacoes". */
export const normalizeText = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();

/** Normalized search terms. "  48h  Exp1 " → ["48h", "exp1"]. */
export const searchTerms = (query: string): string[] =>
  normalizeText(query).split(/\s+/).filter(Boolean);

/** The name holds EVERY term, in any order, ignoring case and accents. */
export function matchesQuery(name: string, query: string): boolean {
  const normalized = normalizeText(name);
  return searchTerms(query).every((t) => normalized.includes(t));
}

/** Filters and keeps the original order. An empty query returns everything. */
export function filterByName<T extends { fileName: string }>(
  items: readonly T[],
  query: string,
): T[] {
  if (searchTerms(query).length === 0) return [...items];
  return items.filter((item) => matchesQuery(item.fileName, query));
}

export type Segment = {
  text: string;
  isMatch: boolean;
};

/** For each normalized character, the index of the original character it came from. */
function ownerIndexes(normalizedChars: string[]): number[] {
  return normalizedChars.flatMap((n, i) => Array.from({ length: n.length }, () => i));
}

type NormalizedName = { normalized: string; owners: number[] };

/** The indexes of the original characters covered by any occurrence of any term. */
function matchedIndexes({ normalized, owners }: NormalizedName, query: string): Set<number> {
  const marked = new Set<number>();
  for (const term of searchTerms(query)) {
    for (
      let at = normalized.indexOf(term);
      at >= 0;
      at = normalized.indexOf(term, at + term.length)
    ) {
      for (const owner of owners.slice(at, at + term.length)) marked.add(owner);
    }
  }
  return marked;
}

function joinSegments(chars: string[], marked: Set<number>): Segment[] {
  const segments: Segment[] = [];
  chars.forEach((char, i) => {
    const isMatch = marked.has(i);
    const last = segments.at(-1);
    if (last && last.isMatch === isMatch) last.text += char;
    else segments.push({ text: char, isMatch });
  });
  return segments;
}

/**
 * Splits the name into segments to highlight what matched the query.
 * highlight("BV2-48h-exp1.xls", "48h") → [{BV2-}, {48h, match}, {-exp1.xls}]
 */
export function highlight(name: string, query: string): Segment[] {
  const chars = Array.from(name);
  // Normalized one character at a time, so each match maps back to the original characters.
  const normalizedChars = chars.map(normalizeText);
  const indexed = { normalized: normalizedChars.join(""), owners: ownerIndexes(normalizedChars) };
  return joinSegments(chars, matchedIndexes(indexed, query));
}
