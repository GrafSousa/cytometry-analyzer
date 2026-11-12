import { ok, err } from './result';
import type { DomainError } from './errors';
import { isAlive, panelOf, parseQuadrant } from './naming';
import type { GroupSum, MarkerResult, Panel, PanelOutcome, QuadGroup, Row } from './types';

/**
 * Calcula um panel de uma planilha.
 *
 * Regras:
 * - Só linhas com "panel N_" no nome.
 * - 100% = #Cells da linha que termina em "/Alive".
 * - Marcadores negativos (terminados em "-") são ignorados.
 * - Cada marcador positivo soma o #Cells dos quadrantes em que aparece, dentro de cada grupo
 *   (Q1–Q4, Q5–Q8, Q9–Q12).
 * - Se o marcador aparece em mais de um grupo (ex.: PE-Vio770-A+ em Q5–Q8 e Q9–Q12),
 *   o total é a MÉDIA das somas dos grupos.
 * - % = total / Alive.
 */
export function analyzePanel(rows: Row[], panel: Panel): PanelOutcome {
  const mine = rows.filter((r) => panelOf(r.name) === panel);
  if (mine.length === 0) return err([{ code: 'MissingPanel', panel }]);

  const alives = mine.filter((r) => isAlive(r.name));
  if (alives.length === 0) return err([{ code: 'MissingAliveRow', panel }]);
  if (alives.length > 1) return err([{ code: 'DuplicateAliveRow', panel, lines: alives.map((r) => r.line) }]);

  const aliveRow = alives[0];
  const alive = aliveRow.cells;
  if (alive === null) return err([{ code: 'NonNumericCells', panel, line: aliveRow.line, raw: aliveRow.rawCells }]);
  if (alive === 0) return err([{ code: 'AliveZero', panel }]);

  const errors: DomainError[] = [];
  const groupTotals = new Map<QuadGroup, number>();
  // marcador → grupo → soma
  const sums = new Map<string, Map<QuadGroup, GroupSum>>();
  let quadrantRows = 0;

  for (const r of mine) {
    const quad = parseQuadrant(r.name);
    if (!quad) continue;
    quadrantRows++;
    if (r.cells === null) {
      errors.push({ code: 'NonNumericCells', panel, line: r.line, raw: r.rawCells });
      continue;
    }
    groupTotals.set(quad.group, (groupTotals.get(quad.group) ?? 0) + r.cells);

    for (const { marker, positive } of quad.markers) {
      if (!positive) continue;
      const byGroup = sums.get(marker) ?? new Map<QuadGroup, GroupSum>();
      const g = byGroup.get(quad.group) ?? { group: quad.group, quadrants: [], cells: 0 };
      g.quadrants.push(quad.q);
      g.cells += r.cells;
      byGroup.set(quad.group, g);
      sums.set(marker, byGroup);
    }
  }

  if (quadrantRows === 0) return err([{ code: 'NoQuadrantRows', panel }]);

  // Cada grupo de 4 quadrantes divide o Alive inteiro, então a soma do grupo deve ser igual ao Alive.
  for (const [group, total] of [...groupTotals].sort(([a], [b]) => a - b)) {
    if (total !== alive) errors.push({ code: 'QuadrantSumMismatch', panel, group, expected: alive, actual: total });
  }
  if (errors.length > 0) return err(errors);

  const markers: MarkerResult[] = [...sums].map(([marker, byGroup]) => {
    const groups = [...byGroup.values()].sort((a, b) => a.group - b.group);
    const cells = groups.reduce((s, g) => s + g.cells, 0) / groups.length;
    return { marker, groups, cells, fraction: cells / alive };
  });

  return ok({ panel, aliveName: aliveRow.name, alive, markers });
}
