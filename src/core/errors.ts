import type { Panel, QuadGroup } from "@/core/types";
import { ptBR } from "@/messages/pt-br";

/** Every expected failure. Plain data, not exceptions, so it is easy to test and to show. */
export type DomainError =
  | { code: "UnsupportedFormat"; ext: string }
  | { code: "EmptyFile" }
  | { code: "UnreadableFile"; cause: string }
  | { code: "MissingColumns"; expected: string[] }
  | { code: "MissingPanel"; panel: Panel }
  | { code: "MissingAliveRow"; panel: Panel }
  | { code: "DuplicateAliveRow"; panel: Panel; lines: number[] }
  | { code: "NonNumericCells"; panel: Panel; line: number; raw: unknown }
  | { code: "AliveZero"; panel: Panel }
  | { code: "NoQuadrantRows"; panel: Panel }
  | {
      code: "QuadrantSumMismatch";
      panel: Panel;
      group: QuadGroup;
      expected: number;
      actual: number;
    };

/**
 * The message table is typed by error code, so a new code without a message does not compile.
 * The cast is safe: each entry receives the error whose code selected it.
 */
export const toMessage = (error: DomainError): string =>
  (ptBR.errors[error.code] as (e: DomainError) => string)(error);
