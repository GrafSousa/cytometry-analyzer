import type { CSSProperties } from "react";

import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  FileIcon,
  HistoryIcon,
  WarningIcon,
} from "@/components/icons";
import { PanelTable } from "@/components/panel-table";
import { toMessage, type DomainError } from "@/core/errors";
import { highlight } from "@/core/search";
import { PANELS, type FileReport, type Panel, type ReportStatus } from "@/core/types";
import { ptBR } from "@/messages/pt-br";

const copy = ptBR.card;

const STATUS: Record<ReportStatus, { className: string; Icon: typeof CheckIcon }> = {
  ok: { className: "pa-badge--ok", Icon: CheckIcon },
  partial: { className: "pa-badge--partial", Icon: WarningIcon },
  failed: { className: "pa-badge--failed", Icon: CloseIcon },
};

// Past this many cards the entrance stagger would be too slow, so the rest arrive together.
const MAX_STAGGER = 10;

function FileName({ id, fileName, query }: { id: string; fileName: string; query: string }) {
  return (
    <div className="pa-card__name">
      <span style={{ color: "var(--ink-subtle)", display: "flex", flex: "none" }}>
        <FileIcon size={22} />
      </span>
      <h2
        id={id}
        title={fileName}
        style={{
          margin: 0,
          font: "inherit",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {highlight(fileName, query).map((segment, i) =>
          segment.isMatch ? (
            <mark key={i} className="pa-mark">
              {segment.text}
            </mark>
          ) : (
            segment.text
          ),
        )}
      </h2>
    </div>
  );
}

function StatusBadges({ status, isCached }: { status: ReportStatus; isCached?: boolean }) {
  const { className, Icon } = STATUS[status];
  return (
    <div className="pa-card__badges">
      {isCached && (
        <span className="pa-badge pa-badge--cached" title={copy.cachedHint}>
          <HistoryIcon size={16} />
          {copy.cached}
        </span>
      )}
      <span className={`pa-badge ${className}`}>
        <Icon size={16} />
        {copy.status[status]}
      </span>
    </div>
  );
}

function FailedBody({ errors }: { errors: DomainError[] }) {
  return (
    <div className="pa-card__body pa-card__error">
      <AlertIcon />
      {errors.length === 1 ? (
        <strong>{toMessage(errors[0])}</strong>
      ) : (
        <ul>
          {errors.map((error, i) => (
            <li key={i}>{toMessage(error)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PanelError({ panel, errors }: { panel: Panel; errors: DomainError[] }) {
  return (
    <section className="pa-panel">
      <h3 style={{ margin: 0, font: "700 18px/24px var(--font-display)" }}>
        {ptBR.panel.title(panel)}
      </h3>
      <div className="pa-alert pa-alert--warning">
        <WarningIcon />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {errors.map((error, i) => (
            <span key={i} className={i === 0 ? "pa-alert__title" : "pa-alert__text"}>
              {toMessage(error)}
            </span>
          ))}
          {errors[0]?.code === "MissingPanel" && (
            <span className="pa-alert__text">{copy.otherPanelOk}</span>
          )}
        </div>
      </div>
    </section>
  );
}

type FileResultCardProps = {
  report: FileReport;
  /** Position in the batch: the cards enter one after the other. */
  index: number;
  query?: string;
};

export function FileResultCard({ report, index, query = "" }: FileResultCardProps) {
  const headingId = `f-${report.id}`;

  return (
    <article
      data-slot="file-result-card"
      data-status={report.status}
      className="pa-card pa-enter"
      style={{ "--i": Math.min(index, MAX_STAGGER) } as CSSProperties}
      aria-labelledby={headingId}
    >
      <header className="pa-card__header">
        <FileName id={headingId} fileName={report.fileName} query={query} />
        <StatusBadges status={report.status} isCached={report.cached} />
      </header>

      {report.status === "failed" ? (
        <FailedBody errors={report.errors} />
      ) : (
        <div className="pa-card__panels">
          {PANELS.map((panel) => {
            const outcome = report.panels[panel];
            return outcome.ok ? (
              <PanelTable key={panel} result={outcome.value} />
            ) : (
              <PanelError key={panel} panel={panel} errors={outcome.error} />
            );
          })}
        </div>
      )}
    </article>
  );
}
