import type { ReactNode } from "react";

import type { FileReport } from "@/core/types";
import type { BatchProgress } from "@/hooks/use-batch";
import { ptBR } from "@/messages/pt-br";

type BatchSummaryProps = {
  reports: FileReport[];
  progress: BatchProgress | null;
  /** Action buttons (upload more, clear…), shown when the batch is done. */
  actions?: ReactNode;
};

const copy = ptBR.summary;
const PERCENT = 100;

export function countReports(reports: FileReport[]) {
  return {
    ok: reports.filter((r) => r.status === "ok").length,
    partial: reports.filter((r) => r.status === "partial").length,
    failed: reports.filter((r) => r.status === "failed").length,
    cached: reports.filter((r) => r.cached).length,
  };
}

const STATUS_KEYS = ["ok", "partial", "failed", "cached"] as const;

/** The status parts with at least one file; `alwaysOk` keeps "0 com sucesso" in the sentence. */
function statusParts(reports: FileReport[], { alwaysOk }: { alwaysOk: boolean }) {
  const counts = countReports(reports);
  return STATUS_KEYS.filter((key) => counts[key] > 0 || (alwaysOk && key === "ok")).map((key) => ({
    key,
    text: copy.status[key](counts[key]),
  }));
}

function Chips({ reports }: { reports: FileReport[] }) {
  const parts = statusParts(reports, { alwaysOk: false });
  return (
    <div className="pa-chips">
      {parts.map(({ key, text }) => (
        <span key={key} className={`pa-chip pa-chip--${key}`}>
          {text}
        </span>
      ))}
    </div>
  );
}

/** What the screen reader announces (a single role="status" region, always in the DOM). */
export function summaryText(reports: FileReport[], progress: BatchProgress | null): string {
  if (!progress) return "";
  if (progress.done < progress.total) return copy.processing(progress.done, progress.total);
  const parts = statusParts(reports, { alwaysOk: true }).map(({ text }) => text);
  return `${copy.processed(reports.length)}: ${parts.join(", ")}.`;
}

function ProgressBox({ reports, progress }: { reports: FileReport[]; progress: BatchProgress }) {
  const percent = Math.round((progress.done / progress.total) * PERCENT);
  return (
    <section className="pa-panel-box pa-progress-box pa-enter" aria-hidden="true">
      <div className="pa-progress-box__head">
        <h1>{copy.processing(progress.done, progress.total)}</h1>
        <span className="pa-progress-box__pct">{percent}%</span>
      </div>
      <div className="pa-progress">
        <div className="pa-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <Chips reports={reports} />
    </section>
  );
}

function DoneBox({ reports, actions }: { reports: FileReport[]; actions?: ReactNode }) {
  return (
    <section className="pa-panel-box pa-enter" aria-hidden="true">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h1>{copy.processed(reports.length)}</h1>
        <Chips reports={reports} />
      </div>
      {actions && <div className="pa-actions">{actions}</div>}
    </section>
  );
}

export function BatchSummary({ reports, progress, actions }: BatchSummaryProps) {
  const isBusy = progress !== null && progress.done < progress.total;
  const isDone = progress !== null && !isBusy && reports.length > 0;

  return (
    <>
      <p data-slot="batch-summary" role="status" className="pa-sr-only">
        {summaryText(reports, progress)}
      </p>
      {progress && isBusy && <ProgressBox reports={reports} progress={progress} />}
      {isDone && <DoneBox reports={reports} actions={actions} />}
    </>
  );
}
