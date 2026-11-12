import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { processBatch, type InputFile } from '../../src/services/processBatch';

/**
 * Teste opcional com planilhas REAIS, que nunca vão para o repositório.
 * Coloque os arquivos em fixtures-local/ (está no .gitignore). Sem a pasta, este teste é pulado.
 */
const dir = fileURLToPath(new URL('../../fixtures-local/', import.meta.url));
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(xls|xlsx|csv)$/i.test(f)) : [];

describe.skipIf(files.length === 0)('planilhas reais em fixtures-local/', () => {
  test.each(files)('%s é processada sem erro inesperado', async (name) => {
    const bytes = readFileSync(join(dir, name));
    const input: InputFile = { name, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer };
    const [report] = await processBatch([input]);
    if (report.status === 'failed') throw new Error(`${name}: ${JSON.stringify(report.errors)}`);
    expect(['ok', 'partial']).toContain(report.status);
  });
});
