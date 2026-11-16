import type { CSSProperties } from "react";

import { formatCells, formatPercent } from "@/core/format";
import type { MarkerResult, PanelResult } from "@/core/types";
import { ptBR } from "@/messages/pt-br";

const copy = ptBR.panel;

const quadrantList = (quadrants: number[]) => quadrants.map((q) => `Q${q}`).join(" + ");

/** How the value was reached: "Q1 + Q2" or, for a marker in two groups, the explained mean. */
function origin(marker: MarkerResult): string {
  if (marker.groups.length === 1) return quadrantList(marker.groups[0].quadrants);
  return copy.average(
    marker.groups.map((g) => `${quadrantList(g.quadrants)} (${formatCells(g.cells)})`),
  );
}

function MarkerRow({ marker, index }: { marker: MarkerResult; index: number }) {
  const barWidth = `${Math.min(marker.fraction, 1) * 100}%`;
  return (
    <tr>
      <th scope="row">{marker.marker}+</th>
      <td className="pa-origin">{origin(marker)}</td>
      <td className="pa-num">{formatCells(marker.cells)}</td>
      <td className="pa-num">
        <div className="pa-pct">
          <strong>{formatPercent(marker.fraction)}</strong>
          <div className="pa-pct__bar" aria-hidden="true">
            <div
              className="pa-pct__fill"
              style={{ width: barWidth, "--i": index } as CSSProperties}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

export function PanelTable({ result }: { result: PanelResult }) {
  return (
    <section data-slot="panel-table" className="pa-panel">
      <div className="pa-panel__head">
        <h3>{copy.title(result.panel)}</h3>
        <span className="pa-panel__alive" title={result.aliveName}>
          {copy.alive} <strong>{formatCells(result.alive)}</strong> {copy.cellsUnit}
        </span>
      </div>
      <div className="pa-table-wrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th scope="col">{copy.columns.marker}</th>
              <th scope="col">{copy.columns.quadrants}</th>
              <th scope="col" className="pa-num">
                {copy.columns.cells}
              </th>
              <th scope="col" className="pa-num">
                {copy.columns.percent}
              </th>
            </tr>
          </thead>
          <tbody>
            {result.markers.map((marker, i) => (
              <MarkerRow key={marker.marker} marker={marker} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
