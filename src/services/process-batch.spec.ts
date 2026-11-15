import { err, ok } from "@/core/result";
import {
  processBatch as sut,
  validateBatch,
  type GridReader,
  type InputFile,
} from "@/services/process-batch";
import { sampleGrid } from "@/tests/helpers";

// Fake files: the content is just a label the fake reader understands.
const file = (name: string, label = "good"): InputFile => ({
  name,
  arrayBuffer: async () => new TextEncoder().encode(label).buffer as ArrayBuffer,
});

const READS: Record<string, () => ReturnType<GridReader>> = {
  good: () => ok(sampleGrid()),
  corrupt: () => err({ code: "UnreadableFile", cause: "arquivo corrompido" }),
  crash: () => {
    throw new Error("Unexpected reader bug");
  },
  "no-header": () => ok([["x", "y"]]),
};

const fakeReader: GridReader = (bytes) =>
  (READS[new TextDecoder().decode(bytes)] ?? (() => ok([])))();

const manyFiles = (length: number) => Array.from({ length }, (_, i) => file(`${i}.xls`));

describe("service: processBatch isolates each file", () => {
  it("should keep errors in the middle of the batch isolated, in order", async () => {
    const files = [
      file("exp1.xls"),
      file("exp2.xls", "corrupt"),
      file("exp3.xls", "crash"),
      file("notas.txt"),
      file("exp4.csv", "no-header"),
      file("exp5.xlsx"),
    ];
    const progress: number[] = [];
    const reports = await sut(files, {
      onProgress: (done) => progress.push(done),
      read: fakeReader,
    });

    expect(reports.map((r) => [r.fileName, r.status])).toEqual([
      ["exp1.xls", "ok"],
      ["exp2.xls", "failed"],
      ["exp3.xls", "failed"],
      ["notas.txt", "failed"],
      ["exp4.csv", "failed"],
      ["exp5.xlsx", "ok"],
    ]);
    expect(reports.map((r) => (r.status === "failed" ? r.errors[0].code : null))).toEqual([
      null,
      "UnreadableFile",
      "UnreadableFile",
      "UnsupportedFormat",
      "MissingColumns",
      null,
    ]);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("should give a good file the same result with or without bad files in the batch", async () => {
    const withoutId = <T extends { id: string }>(r: T) => ({ ...r, id: "" });
    const [alone] = await sut([file("exp1.xls")], { read: fakeReader });
    const mixed = await sut(
      [file("bad.xls", "crash"), file("exp1.xls"), file("bad2.xls", "corrupt")],
      { read: fakeReader },
    );
    expect(withoutId(mixed[1])).toEqual(withoutId(alone));
  });

  it("should give files with the same name different ids", async () => {
    const reports = await sut([file("a.xls"), file("a.xls")], { read: fakeReader });
    expect(reports[0].id).not.toBe(reports[1].id);
  });
});

describe("service: validateBatch", () => {
  it("should accept 1 to 50 files", () => {
    expect(validateBatch([file("a.xls")])).toBeNull();
    expect(validateBatch(manyFiles(50))).toBeNull();
  });

  it("should refuse an empty batch or more than 50 files", () => {
    expect(validateBatch([])).toBe("Nenhum arquivo selecionado.");
    expect(validateBatch(manyFiles(51))).toBe(
      "Você selecionou 51 arquivos. O máximo é 50 por vez. Selecione menos arquivos e tente de novo.",
    );
  });
});
