import type { ReactNode } from 'react';
import type { FileReport } from '../core/types';

interface Props {
  reports: FileReport[];
  progress: { done: number; total: number } | null;
  /** Botões de ação (enviar novas, limpar…), mostrados quando o lote termina. */
  actions?: ReactNode;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function countReports(reports: FileReport[]) {
  return {
    ok: reports.filter((r) => r.status === 'ok').length,
    partial: reports.filter((r) => r.status === 'partial').length,
    failed: reports.filter((r) => r.status === 'failed').length,
    cached: reports.filter((r) => r.cached).length,
  };
}

function Chips({ reports }: { reports: FileReport[] }) {
  const c = countReports(reports);
  return (
    <div className="pa-chips">
      {c.ok > 0 && <span className="pa-chip pa-chip--ok">{plural(c.ok, 'com sucesso', 'com sucesso')}</span>}
      {c.partial > 0 && <span className="pa-chip pa-chip--partial">{plural(c.partial, 'parcial', 'parciais')}</span>}
      {c.failed > 0 && <span className="pa-chip pa-chip--failed">{plural(c.failed, 'com erro', 'com erro')}</span>}
      {c.cached > 0 && <span className="pa-chip pa-chip--cached">{c.cached === 1 ? '1 veio do cache' : `${c.cached} vieram do cache`}</span>}
    </div>
  );
}

/** Texto anunciado pelo leitor de tela (uma única região role="status", sempre no DOM). */
export function summaryText(reports: FileReport[], progress: Props['progress']): string {
  if (!progress) return '';
  if (progress.done < progress.total) return `Processando ${progress.done} de ${progress.total} planilhas…`;
  const c = countReports(reports);
  const parts = [plural(c.ok, 'com sucesso', 'com sucesso')];
  if (c.partial) parts.push(plural(c.partial, 'parcial', 'parciais'));
  if (c.failed) parts.push(plural(c.failed, 'com erro', 'com erro'));
  if (c.cached) parts.push(c.cached === 1 ? '1 veio do cache' : `${c.cached} vieram do cache`);
  return `${plural(reports.length, 'planilha processada', 'planilhas processadas')}: ${parts.join(', ')}.`;
}

export function BatchSummary({ reports, progress, actions }: Props) {
  const busy = progress !== null && progress.done < progress.total;
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <p role="status" className="pa-sr-only">
        {summaryText(reports, progress)}
      </p>

      {progress && busy && (
        <section className="pa-panel-box pa-progress-box pa-enter" aria-hidden="true">
          <div className="pa-progress-box__head">
            <h1>
              Processando {progress.done} de {progress.total} planilhas…
            </h1>
            <span className="pa-progress-box__pct">{pct}%</span>
          </div>
          <div className="pa-progress">
            <div className="pa-progress__fill" style={{ width: `${pct}%` }} />
          </div>
          <Chips reports={reports} />
        </section>
      )}

      {progress && !busy && reports.length > 0 && (
        <section className="pa-panel-box pa-enter" aria-hidden="true">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1>{plural(reports.length, 'planilha processada', 'planilhas processadas')}</h1>
            <Chips reports={reports} />
          </div>
          {actions && <div className="pa-actions">{actions}</div>}
        </section>
      )}
    </>
  );
}
