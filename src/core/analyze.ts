import { analyzePanel } from './compute';
import type { FileReport, Row } from './types';

/**
 * Analisa as linhas de UMA planilha. Os dois panels são calculados de forma independente:
 * se um falhar, o outro continua sendo exibido (status "partial").
 */
export function analyzeSheet(id: string, fileName: string, rows: Row[]): FileReport {
  const p1 = analyzePanel(rows, 1);
  const p2 = analyzePanel(rows, 2);
  if (!p1.ok && !p2.ok) return { id, fileName, status: 'failed', errors: [...p1.error, ...p2.error] };
  return { id, fileName, status: p1.ok && p2.ok ? 'ok' : 'partial', panels: { 1: p1, 2: p2 } };
}
