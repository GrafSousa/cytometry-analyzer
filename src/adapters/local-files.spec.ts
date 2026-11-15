import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { processBatch, type InputFile } from "@/services/process-batch";

/**
 * Optional test with REAL spreadsheets, which never go into the repository (it is public).
 * Put the files in fixtures-local/ (git-ignored). Without the folder, this test is skipped.
 */
const dir = fileURLToPath(new URL("../../fixtures-local/", import.meta.url));
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(xls|xlsx|csv)$/i.test(f)) : [];

const toInputFile = (name: string): InputFile => {
  const bytes = readFileSync(join(dir, name));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return { name, arrayBuffer: async () => buffer as ArrayBuffer };
};

describe.skipIf(files.length === 0)("adapter: real spreadsheets in fixtures-local/", () => {
  it.each(files)("should process %s without an unexpected error", async (name) => {
    const [report] = await processBatch([toInputFile(name)]);
    if (report.status === "failed") throw new Error(`${name}: ${JSON.stringify(report.errors)}`);
    expect(["ok", "partial"]).toContain(report.status);
  });
});
