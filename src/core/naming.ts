import type { Panel, QuadGroup } from "@/core/types";

/**
 * Normalizes Unicode minus signs and dashes, and collapses spaces. `\s` already matches the
 * non-breaking spaces (U+00A0, U+202F) that exports sometimes carry.
 */
export const normalizeName = (s: string): string =>
  s.normalize("NFKC").replace(/[−–]/g, "-").replace(/\s+/g, " ").trim();

// Exactly "panel 1_" or "panel 2_": "panel 10_" and "xpanel 1_" must not match.
const PANEL_RE = /(?:^|[^A-Za-z0-9])panel ([12])_/i;
const ALIVE_RE = /\/Alive$/;
const QUADRANT_RE = /\/Alive\/Q(\d{1,2}):\s*(.+)$/;
const QUADRANTS_PER_GROUP = 4;
const LAST_QUADRANT = 12;

export function panelOf(name: string): Panel | null {
  const match = PANEL_RE.exec(normalizeName(name));
  return match ? (Number(match[1]) as Panel) : null;
}

/** The row that holds 100% of the panel's cells. */
export const isAlive = (name: string): boolean => ALIVE_RE.test(normalizeName(name));

export type QuadrantMarker = {
  /** Name without the sign, for example "PerCP-Vio700-A". */
  marker: string;
  isPositive: boolean;
};

export type Quadrant = {
  q: number;
  group: QuadGroup;
  markers: QuadrantMarker[];
};

const hasSign = (s: string) => s.endsWith("+") || s.endsWith("-");

// The sign is always the last character: marker names have hyphens inside them.
const toMarker = (s: string): QuadrantMarker => ({
  marker: s.slice(0, -1).trim(),
  isPositive: s.endsWith("+"),
});

/**
 * Reads a quadrant row.
 * ".../Alive/Q1: PE-A- , PerCP-Vio700-A+" → { q: 1, group: 1, markers: [PE-A (-), PerCP-Vio700-A (+)] }
 */
export function parseQuadrant(name: string): Quadrant | null {
  const match = QUADRANT_RE.exec(normalizeName(name));
  if (!match) return null;
  const q = Number(match[1]);
  if (q < 1 || q > LAST_QUADRANT) return null;
  const markers = match[2]
    .split(",")
    .map((s) => s.trim())
    .filter(hasSign)
    .map(toMarker);
  return { q, group: Math.ceil(q / QUADRANTS_PER_GROUP) as QuadGroup, markers };
}
