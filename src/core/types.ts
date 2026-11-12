import type { Result } from './result';
import type { DomainError } from './errors';

export type Panel = 1 | 2;
export const PANELS: readonly Panel[] = [1, 2];

/** Grupo de quadrantes: 1 = Q1-Q4, 2 = Q5-Q8, 3 = Q9-Q12. */
export type QuadGroup = 1 | 2 | 3;

/** Grade crua lida da planilha (linhas x colunas). */
export type Grid = unknown[][];

/** Linha relevante da planilha: só "Name" e "#Cells". */
export interface Row {
  /** Número da linha na planilha original (1 = primeira linha), para mensagens de erro. */
  line: number;
  name: string;
  /** #Cells já convertido; null quando o valor não é numérico. */
  cells: number | null;
  rawCells: unknown;
}

/** Soma de um marcador positivo dentro de um grupo de quadrantes. */
export interface GroupSum {
  group: QuadGroup;
  quadrants: number[];
  cells: number;
}

/** Resultado de um marcador positivo (ex.: "PE-A+"). */
export interface MarkerResult {
  /** Nome do marcador sem o sinal, ex.: "PE-A". */
  marker: string;
  /** Uma entrada por grupo de quadrantes em que o marcador aparece. */
  groups: GroupSum[];
  /** Total de células. Se o marcador aparece em mais de um grupo, é a média das somas dos grupos. */
  cells: number;
  /** cells / Alive (0 a 1). */
  fraction: number;
}

export interface PanelResult {
  panel: Panel;
  /** Nome da linha usada como 100%. */
  aliveName: string;
  alive: number;
  markers: MarkerResult[];
}

export type PanelOutcome = Result<PanelResult, DomainError[]>;

/**
 * Relatório de um arquivo. Cada arquivo tem o seu, e um nunca afeta o outro.
 * `cached: true` quando o resultado veio do cache (mesmo conteúdo já calculado antes).
 */
export type FileReport = { id: string; fileName: string; cached?: boolean } & (
  | { status: 'failed'; errors: DomainError[] }
  | { status: 'ok' | 'partial'; panels: Record<Panel, PanelOutcome> }
);

/**
 * Versão das regras de cálculo. Faz parte da chave do cache:
 * ao mudar qualquer regra em compute.ts, aumente este número para invalidar resultados antigos.
 */
export const CALC_VERSION = 1;
