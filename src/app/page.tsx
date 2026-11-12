'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { filterByName } from '../core/search';
import type { FileReport } from '../core/types';
import { createBrowserCache, createMemoryCache, type ResultCache } from '../services/cache';
import { processBatch, validateBatch } from '../services/processBatch';
import { AppHeader } from '../components/AppHeader';
import { BatchSummary } from '../components/BatchSummary';
import { FileResultCard } from '../components/FileResultCard';
import { UploadArea, UploadButton } from '../components/UploadArea';
import { AlertIcon } from '../components/icons';
import { SearchEmpty, SearchField } from '../components/SearchField';

const STEPS = [
  { title: 'Alive é o 100%', text: 'O total de células vem da linha do panel que termina em “/Alive”.' },
  { title: 'Só marcadores positivos', text: 'Para cada marcador “+”, somamos as células dos quadrantes Q1 a Q12 em que ele aparece. Os “−” são ignorados.' },
  { title: 'Média entre grupos', text: 'Se o marcador aparece em dois grupos de quadrantes (como PE-Vio770-A+), usamos a média dos dois.' },
];

export default function HomePage() {
  const [reports, setReports] = useState<FileReport[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [query, setQuery] = useState('');
  const cache = useRef<ResultCache>(createMemoryCache());
  const busy = progress !== null && progress.done < progress.total;

  // O localStorage só existe no navegador: o cache persistente é criado depois que a página carrega.
  useEffect(() => {
    cache.current = createBrowserCache();
    setCacheSize(cache.current.size);
  }, []);

  async function handleFiles(files: File[]) {
    const problem = validateBatch(files);
    setBatchError(problem);
    if (problem) return;

    setReports([]);
    setQuery('');
    setProgress({ done: 0, total: files.length });
    await processBatch(files, {
      cache: cache.current,
      onProgress: (done, total, last) => {
        setReports((prev) => [...prev, last]);
        setProgress({ done, total });
      },
    });
    setCacheSize(cache.current.size);
  }

  function clearResults() {
    setReports([]);
    setProgress(null);
    setBatchError(null);
    setQuery('');
  }

  function clearCache() {
    cache.current.clear();
    setCacheSize(0);
  }

  const home = reports.length === 0 && !busy;
  const visible = filterByName(reports, query);

  return (
    <>
      <AppHeader />
      <main className={`pa-main${home ? ' pa-main--home' : ''}`}>
        {batchError && (
          <div role="alert" className="pa-alert pa-alert--danger">
            <AlertIcon />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="pa-alert__title">Nenhuma planilha foi processada</span>
              <span className="pa-alert__text">{batchError}</span>
            </div>
          </div>
        )}

        {home && (
          <div className="pa-intro pa-enter">
            <h1>Envie as planilhas exportadas do MACSQuant</h1>
            <p>
              Para cada planilha, calculamos o percentual de cada marcador positivo em relação às células vivas (Alive) do panel 1 e
              do panel 2. Cada planilha é calculada separadamente.
            </p>
          </div>
        )}

        {(home || busy) && <UploadArea compact={busy} disabled={busy} onFiles={handleFiles} />}

        <BatchSummary
          reports={reports}
          progress={progress}
          actions={
            <>
              <UploadButton onFiles={handleFiles} />
              <button type="button" className="pa-button pa-button--secondary" onClick={clearResults}>
                Limpar resultados
              </button>
              {cacheSize > 0 && (
                <button type="button" className="pa-button pa-button--ghost" onClick={clearCache} title={`${cacheSize} resultados guardados neste navegador`}>
                  Limpar cache
                </button>
              )}
            </>
          }
        />

        {reports.length > 1 && <SearchField value={query} onChange={setQuery} shown={visible.length} total={reports.length} />}

        {reports.length > 0 && visible.length === 0 && <SearchEmpty query={query} onClear={() => setQuery('')} />}

        {visible.length > 0 && (
          <section aria-label="Resultados por planilha" className="pa-results">
            {visible.map((r, i) => (
              <FileResultCard key={r.id} report={r} index={i} query={query} />
            ))}
          </section>
        )}

        {home && (
          <section className="pa-steps" aria-labelledby="como">
            <h2 id="como">Como o cálculo é feito</h2>
            <div className="pa-steps__grid">
              {STEPS.map((s, i) => (
                <div key={s.title} className="pa-step pa-enter" style={{ '--i': i + 2 } as CSSProperties}>
                  <span className="pa-step__n">{i + 1}</span>
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
