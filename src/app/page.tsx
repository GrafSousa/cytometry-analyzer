"use client";

import { useState } from "react";

import { AppHeader } from "@/components/app-header";
import { BatchActions } from "@/components/batch-actions";
import { BatchError } from "@/components/batch-error";
import { BatchSummary } from "@/components/batch-summary";
import { HowItWorks, Intro } from "@/components/home";
import { Results } from "@/components/results";
import { UploadArea } from "@/components/upload-area";
import { useBatch } from "@/hooks/use-batch";

export default function HomePage() {
  const batch = useBatch();
  const [query, setQuery] = useState("");
  const isHome = batch.reports.length === 0 && !batch.isBusy;
  const showsUpload = isHome || batch.isBusy;

  function processFiles(files: File[]) {
    setQuery("");
    return batch.processFiles(files);
  }

  function clearResults() {
    setQuery("");
    batch.clearResults();
  }

  return (
    <>
      <AppHeader />
      <main className={isHome ? "pa-main pa-main--home" : "pa-main"}>
        {batch.batchError && <BatchError message={batch.batchError} />}
        {isHome && <Intro />}
        {showsUpload && (
          <UploadArea compact={batch.isBusy} disabled={batch.isBusy} onFiles={processFiles} />
        )}
        <BatchSummary
          reports={batch.reports}
          progress={batch.progress}
          actions={
            <BatchActions
              cacheSize={batch.cacheSize}
              onFiles={processFiles}
              onClearResults={clearResults}
              onClearCache={batch.clearCache}
            />
          }
        />
        <Results reports={batch.reports} query={query} onQueryChange={setQuery} />
        {isHome && <HowItWorks />}
      </main>
    </>
  );
}
