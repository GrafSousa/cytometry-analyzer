"use client";

import { useEffect, useRef, useState } from "react";

import type { FileReport } from "@/core/types";
import { createBrowserCache, createMemoryCache, type ResultCache } from "@/services/cache";
import { processBatch, validateBatch } from "@/services/process-batch";

export type BatchProgress = { done: number; total: number };

const appendReport = (report: FileReport) => (previous: FileReport[]) => [...previous, report];

/** The batch's state: the reports, the progress, the batch error and the cache. */
export function useBatch() {
  const [reports, setReports] = useState<FileReport[]>([]);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const cache = useRef<ResultCache>(createMemoryCache());

  // localStorage only exists in the browser, so the persistent cache is created after hydration.
  useEffect(() => {
    cache.current = createBrowserCache();
    setCacheSize(cache.current.size);
  }, []);

  function showProgress(done: number, total: number, last: FileReport) {
    setReports(appendReport(last));
    setProgress({ done, total });
  }

  async function processFiles(files: File[]) {
    const problem = validateBatch(files);
    setBatchError(problem);
    if (problem) return;

    setReports([]);
    setProgress({ done: 0, total: files.length });
    await processBatch(files, { cache: cache.current, onProgress: showProgress });
    setCacheSize(cache.current.size);
  }

  function clearResults() {
    setReports([]);
    setProgress(null);
    setBatchError(null);
  }

  function clearCache() {
    cache.current.clear();
    setCacheSize(0);
  }

  const isBusy = progress !== null && progress.done < progress.total;

  return {
    reports,
    progress,
    batchError,
    cacheSize,
    isBusy,
    processFiles,
    clearResults,
    clearCache,
  };
}
