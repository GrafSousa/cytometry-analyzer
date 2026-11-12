import type { Panel, QuadGroup } from './types';

/** Normaliza o texto: sinal de menos Unicode, espaços não separáveis e espaços repetidos. */
export const normalizeName = (s: string): string =>
  s
    .normalize('NFKC')
    .replace(/[−–]/g, '-')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// "panel 1_" exato: não casa com "panel 10_" nem com "xpanel 1_".
const PANEL_RE = /(?:^|[^A-Za-z0-9])panel ([12])_/i;
const ALIVE_RE = /\/Alive$/;
const QUAD_RE = /\/Alive\/Q(\d{1,2}):\s*(.+)$/;

export function panelOf(name: string): Panel | null {
  const m = PANEL_RE.exec(normalizeName(name));
  return m ? (Number(m[1]) as Panel) : null;
}

/** Linha que representa 100% das células do panel. */
export const isAlive = (name: string): boolean => ALIVE_RE.test(normalizeName(name));

export interface QuadrantMarker {
  /** Nome sem o sinal, ex.: "PerCP-Vio700-A". */
  marker: string;
  positive: boolean;
}

export interface Quadrant {
  q: number;
  group: QuadGroup;
  markers: QuadrantMarker[];
}

/**
 * Lê uma linha de quadrante.
 * ".../Alive/Q1: PE-A- , PerCP-Vio700-A+" → { q: 1, group: 1, markers: [PE-A (-), PerCP-Vio700-A (+)] }
 * O sinal é sempre o último caractere de cada marcador (os nomes têm hífens internos).
 */
export function parseQuadrant(name: string): Quadrant | null {
  const m = QUAD_RE.exec(normalizeName(name));
  if (!m) return null;
  const q = Number(m[1]);
  if (q < 1 || q > 12) return null;
  const markers = m[2]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.endsWith('+') || s.endsWith('-'))
    .map((s) => ({ marker: s.slice(0, -1).trim(), positive: s.endsWith('+') }));
  return { q, group: Math.ceil(q / 4) as QuadGroup, markers };
}
