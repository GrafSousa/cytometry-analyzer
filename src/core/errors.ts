import type { Panel, QuadGroup } from './types';

/** Todos os erros possíveis. São dados simples (não exceções), fáceis de testar e de exibir. */
export type DomainError =
  | { code: 'UnsupportedFormat'; ext: string }
  | { code: 'EmptyFile' }
  | { code: 'UnreadableFile'; cause: string }
  | { code: 'MissingColumns'; expected: string[] }
  | { code: 'MissingPanel'; panel: Panel }
  | { code: 'MissingAliveRow'; panel: Panel }
  | { code: 'DuplicateAliveRow'; panel: Panel; lines: number[] }
  | { code: 'NonNumericCells'; panel: Panel; line: number; raw: unknown }
  | { code: 'AliveZero'; panel: Panel }
  | { code: 'NoQuadrantRows'; panel: Panel }
  | { code: 'QuadrantSumMismatch'; panel: Panel; group: QuadGroup; expected: number; actual: number };

const GROUP_LABEL: Record<QuadGroup, string> = { 1: 'Q1–Q4', 2: 'Q5–Q8', 3: 'Q9–Q12' };

/** Mensagem em português para cada erro. O compilador acusa se algum código ficar sem mensagem. */
export function toMessage(e: DomainError): string {
  switch (e.code) {
    case 'UnsupportedFormat':
      return `Formato não suportado (${e.ext ? '.' + e.ext : 'sem extensão'}). Use .xls, .xlsx ou .csv.`;
    case 'EmptyFile':
      return 'O arquivo está vazio.';
    case 'UnreadableFile':
      return `Não foi possível ler o arquivo. Ele pode estar corrompido. (${e.cause})`;
    case 'MissingColumns':
      return `Colunas obrigatórias não encontradas: ${e.expected.join(', ')}.`;
    case 'MissingPanel':
      return `Panel ${e.panel} não encontrado nesta planilha.`;
    case 'MissingAliveRow':
      return `Panel ${e.panel}: linha terminada em "/Alive" não encontrada.`;
    case 'DuplicateAliveRow':
      return `Panel ${e.panel}: mais de uma linha "/Alive" (linhas ${e.lines.join(', ')}).`;
    case 'NonNumericCells':
      return `Panel ${e.panel}: valor de #Cells não numérico na linha ${e.line} ("${String(e.raw ?? '')}").`;
    case 'AliveZero':
      return `Panel ${e.panel}: #Cells da linha Alive é zero; não é possível calcular percentuais.`;
    case 'NoQuadrantRows':
      return `Panel ${e.panel}: nenhuma linha de quadrante (Q1 a Q12) encontrada abaixo de Alive.`;
    case 'QuadrantSumMismatch':
      return `Panel ${e.panel}: a soma dos quadrantes ${GROUP_LABEL[e.group]} (${e.actual}) é diferente do total de Alive (${e.expected}).`;
    default: {
      const never: never = e;
      return never;
    }
  }
}
