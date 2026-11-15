import { readFileSync } from "node:fs";

import * as XLSX from "xlsx";

import { decodeCsv, readGrid, type SpreadsheetExt } from "@/adapters/sheetjs";
import { analyzeSheet } from "@/core/analyze";
import { toRows } from "@/core/rows";
import { EXAMPLE_XLSX, fixturePath, sampleGrid, unwrap } from "@/tests/helpers";

const analyzeBytes = (bytes: Uint8Array, ext: SpreadsheetExt) =>
  analyzeSheet({
    id: "id",
    fileName: `file.${ext}`,
    rows: unwrap(toRows(unwrap(readGrid(bytes, ext)))),
  });

const exampleBytes = () => new Uint8Array(readFileSync(fixturePath(EXAMPLE_XLSX)));

describe("adapter: readGrid with SheetJS", () => {
  const sut = readGrid;

  it("should read the example .xlsx spreadsheet", () => {
    const result = analyzeBytes(exampleBytes(), "xlsx");
    expect(result.status).toBe("ok");
    if (result.status === "failed") return;
    expect(result.panels[1].ok && result.panels[1].value.alive).toBe(10000);
    expect(result.panels[2].ok && result.panels[2].value.alive).toBe(8000);
  });

  it.each(["xls", "csv"] as const)(
    "should give the same result for the same content in .%s",
    (ext) => {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sampleGrid()), "Sheet0");
      // .xls is written as BIFF8, the format the MACSQuant exports.
      const bookType = ext === "xls" ? "biff8" : ext;
      const bytes = new Uint8Array(XLSX.write(workbook, { bookType, type: "array" }));
      const fromXlsx = analyzeBytes(exampleBytes(), "xlsx");
      const fromOther = analyzeBytes(bytes, ext);
      expect(fromOther.status).toBe("ok");
      if (fromOther.status !== "failed" && fromXlsx.status !== "failed") {
        expect(fromOther.panels).toEqual(fromXlsx.panels);
      }
    },
  );

  it("should return EmptyFile for an empty file", () => {
    expect(sut(new Uint8Array(), "xls")).toEqual({ ok: false, error: { code: "EmptyFile" } });
  });

  it("should never throw on meaningless bytes", () => {
    // Starts like a zip, but is broken.
    const junk = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5]);
    const result = sut(junk, "xlsx");
    // If SheetJS "reads" it, there is still no header.
    if (result.ok) expect(toRows(result.value).ok).toBe(false);
    else expect(result.error.code).toBe("UnreadableFile");
  });
});

describe("adapter: decodeCsv", () => {
  const sut = decodeCsv;

  it("should drop the BOM and read UTF-8", () => {
    expect(sut(new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0xc3, 0xa9]))).toBe("aé");
  });

  it("should fall back to Windows-1252 when the bytes are not UTF-8", () => {
    expect(sut(new Uint8Array([0x61, 0xe9]))).toBe("aé");
  });
});
