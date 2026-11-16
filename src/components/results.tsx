"use client";

import { FileResultCard } from "@/components/file-result-card";
import { SearchEmpty, SearchField } from "@/components/search-field";
import { filterByName } from "@/core/search";
import type { FileReport } from "@/core/types";
import { ptBR } from "@/messages/pt-br";

type ResultsProps = {
  reports: FileReport[];
  query: string;
  onQueryChange: (query: string) => void;
};

/** The search field (from two files up) and one card per spreadsheet that matches it. */
export function Results({ reports, query, onQueryChange }: ResultsProps) {
  const visible = filterByName(reports, query);
  const hasNoMatch = reports.length > 0 && visible.length === 0;

  return (
    <>
      {reports.length > 1 && (
        <SearchField
          value={query}
          onChange={onQueryChange}
          shown={visible.length}
          total={reports.length}
        />
      )}
      {hasNoMatch && <SearchEmpty query={query} onClear={() => onQueryChange("")} />}
      {visible.length > 0 && (
        <section data-slot="results" aria-label={ptBR.results.label} className="pa-results">
          {visible.map((report, i) => (
            <FileResultCard key={report.id} report={report} index={i} query={query} />
          ))}
        </section>
      )}
    </>
  );
}
