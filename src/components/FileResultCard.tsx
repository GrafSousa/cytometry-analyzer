import type { CSSProperties } from 'react';
import { toMessage } from '../core/errors';
import { highlight } from '../core/search';
import { PANELS, type FileReport } from '../core/types';
import { AlertIcon, CheckIcon, CloseIcon, FileIcon, HistoryIcon, WarningIcon } from './icons';
import { PanelTable } from './PanelTable';

const STATUS = {
  ok: { label: 'Sucesso', className: 'pa-badge--ok', Icon: CheckIcon },
  partial: { label: 'Parcial', className: 'pa-badge--partial', Icon: WarningIcon },
  failed: { label: 'Erro', className: 'pa-badge--failed', Icon: CloseIcon },
} as const;

/** Cartão de uma planilha. `index` é a posição no lote: os cartões entram um após o outro. */
export function FileResultCard({ report, index, query = '' }: { report: FileReport; index: number; query?: string }) {
  const status = STATUS[report.status];
  const headingId = `f-${report.id}`;

  return (
    <article className="pa-card pa-enter" style={{ '--i': Math.min(index, 10) } as CSSProperties} aria-labelledby={headingId}>
      <header className="pa-card__header">
        <div className="pa-card__name">
          <span style={{ color: 'var(--ink-subtle)', display: 'flex', flex: 'none' }}>
            <FileIcon size={22} />
          </span>
          <h2 id={headingId} title={report.fileName} style={{ margin: 0, font: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlight(report.fileName, query).map((s, i) =>
              s.match ? (
                <mark key={i} className="pa-mark">
                  {s.text}
                </mark>
              ) : (
                s.text
              ),
            )}
          </h2>
        </div>
        <div className="pa-card__badges">
          {report.cached && (
            <span className="pa-badge pa-badge--cached" title="Este conteúdo já tinha sido calculado; o resultado foi reaproveitado.">
              <HistoryIcon size={16} />
              Do cache
            </span>
          )}
          <span className={`pa-badge ${status.className}`}>
            <status.Icon size={16} />
            {status.label}
          </span>
        </div>
      </header>

      {report.status === 'failed' ? (
        <div className="pa-card__body pa-card__error">
          <AlertIcon />
          {report.errors.length === 1 ? (
            <strong>{toMessage(report.errors[0])}</strong>
          ) : (
            <ul>
              {report.errors.map((e, i) => (
                <li key={i}>{toMessage(e)}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="pa-card__panels">
          {PANELS.map((p) => {
            const outcome = report.panels[p];
            return outcome.ok ? (
              <PanelTable key={p} result={outcome.value} />
            ) : (
              <section key={p} className="pa-panel">
                <h3 style={{ margin: 0, font: '700 18px/24px var(--font-display)' }}>Panel {p}</h3>
                <div className="pa-alert pa-alert--warning">
                  <WarningIcon />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {outcome.error.map((e, i) => (
                      <span key={i} className={i === 0 ? 'pa-alert__title' : 'pa-alert__text'}>
                        {toMessage(e)}
                      </span>
                    ))}
                    {outcome.error[0]?.code === 'MissingPanel' && (
                      <span className="pa-alert__text">O outro panel foi calculado normalmente.</span>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}
