import type { CSSProperties } from 'react';
import { formatCells, formatPercent } from '../core/format';
import type { MarkerResult, PanelResult } from '../core/types';

const quads = (qs: number[]) => qs.map((q) => `Q${q}`).join(' + ');

/** Como o valor foi obtido: "Q1 + Q2" ou, para marcadores em dois grupos, a média explicada. */
function origin(m: MarkerResult): string {
  if (m.groups.length === 1) return quads(m.groups[0].quadrants);
  return `média de ${m.groups.map((g) => `${quads(g.quadrants)} (${formatCells(g.cells)})`).join(' e ')}`;
}

export function PanelTable({ result }: { result: PanelResult }) {
  return (
    <section className="pa-panel">
      <div className="pa-panel__head">
        <h3>Panel {result.panel}</h3>
        <span className="pa-panel__alive" title={result.aliveName}>
          Alive (100%): <strong>{formatCells(result.alive)}</strong> células
        </span>
      </div>
      <div className="pa-table-wrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th scope="col">Marcador</th>
              <th scope="col">Quadrantes</th>
              <th scope="col" className="pa-num">Células</th>
              <th scope="col" className="pa-num">% do Alive</th>
            </tr>
          </thead>
          <tbody>
            {result.markers.map((m, i) => (
              <tr key={m.marker}>
                <th scope="row">{m.marker}+</th>
                <td className="pa-origin">{origin(m)}</td>
                <td className="pa-num">{formatCells(m.cells)}</td>
                <td className="pa-num">
                  <div className="pa-pct">
                    <strong>{formatPercent(m.fraction)}</strong>
                    <div className="pa-pct__bar" aria-hidden="true">
                      <div className="pa-pct__fill" style={{ width: `${Math.min(m.fraction, 1) * 100}%`, '--i': i } as CSSProperties} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
