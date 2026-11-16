import { analyzeSheet } from "@/core/analyze";
import { analyzePanel as sut } from "@/core/compute";
import { toMessage } from "@/core/errors";
import { formatPercent } from "@/core/format";
import type { PanelResult, Row } from "@/core/types";
import { sampleRows, unwrap, withCells, withDuplicateAlive, withoutPanel } from "@/tests/helpers";

const marker = (result: PanelResult, name: string) => {
  const found = result.markers.find((m) => m.marker === name);
  if (!found) throw new Error(`Marker ${name} not found`);
  return found;
};

const analyze = (rows: Row[]) => analyzeSheet({ id: "id", fileName: "x.xls", rows });

describe("core: analyzePanel with the example spreadsheet (fictional, checked by hand)", () => {
  const rows = sampleRows();

  it("should use Alive = 10000 as 100% and sum the positive markers in panel 1", () => {
    const result = unwrap(sut(rows, 1));
    expect(result.alive).toBe(10000);
    expect(result.aliveName).toBe("1.3 Exemplo panel 1_24h_exp1.mqd/Cells/Single Cells/Alive");
    expect(result.markers.map((m) => m.marker)).toEqual([
      "PerCP-Vio700-A",
      "PE-A",
      "PE-Vio770-A",
      "APC-A",
      "APC-Vio770-A",
    ]);

    expect(marker(result, "PerCP-Vio700-A").cells).toBe(6000 + 1500); // Q1 + Q2
    expect(formatPercent(marker(result, "PerCP-Vio700-A").fraction)).toBe(formatPercent(0.75));
    expect(marker(result, "PE-A").cells).toBe(1500 + 500); // Q2 + Q3
    expect(marker(result, "APC-A").cells).toBe(1200 + 4000); // Q6 + Q7
    expect(marker(result, "APC-Vio770-A").cells).toBe(300 + 200); // Q10 + Q11
  });

  it("should average PE-Vio770-A+ over its two quadrant groups", () => {
    const result = marker(unwrap(sut(rows, 1)), "PE-Vio770-A");
    expect(result.groups).toEqual([
      { group: 2, quadrants: [5, 6], cells: 800 + 1200 },
      { group: 3, quadrants: [9, 10], cells: 1500 + 300 },
    ]);
    expect(result.cells).toBe(1900);
    expect(result.fraction).toBeCloseTo(0.19, 10);
  });

  it("should keep every panel 2 percentage between 0 and 100%", () => {
    const result = unwrap(sut(rows, 2));
    expect(result.alive).toBe(8000);
    expect(marker(result, "PE-Vio770-A").cells).toBe(7900);
    expect(marker(result, "APC-A").cells).toBe(7700);
    expect(marker(result, "APC-Vio770-A").fraction).toBeCloseTo(0.1125, 10);
    for (const m of result.markers) {
      expect(m.fraction).toBeGreaterThanOrEqual(0);
      expect(m.fraction).toBeLessThanOrEqual(1);
    }
  });

  it("should ignore the compensation, unstained and viobility rows", () => {
    expect(analyze(rows).status).toBe("ok");
  });
});

describe("core: analyzeSheet errors per panel", () => {
  const rows = sampleRows();
  const panel1 = "panel 1_";

  it("should show panel 1 and the panel 2 error when panel 2 is missing (partial)", () => {
    const result = analyze(withoutPanel(rows, "panel 2_"));
    expect(result.status).toBe("partial");
    if (result.status === "failed") throw new Error("Should not fail");
    expect(result.panels[1].ok).toBe(true);
    expect(result.panels[2]).toEqual({ ok: false, error: [{ code: "MissingPanel", panel: 2 }] });
  });

  it("should fail with both errors when no panel exists", () => {
    const result = analyze(withoutPanel(withoutPanel(rows, panel1), "panel 2_"));
    expect(result).toMatchObject({
      status: "failed",
      errors: [
        { code: "MissingPanel", panel: 1 },
        { code: "MissingPanel", panel: 2 },
      ],
    });
  });

  it.each([
    [
      "Alive is missing",
      () => rows.filter((r) => !(r.name.includes(panel1) && r.name.endsWith("/Alive"))),
      "MissingAliveRow",
    ],
    ["Alive is duplicated", () => withDuplicateAlive(rows, panel1), "DuplicateAliveRow"],
    [
      "Alive is 0",
      () => withCells(rows, { panelText: panel1, suffix: "/Alive", value: 0 }),
      "AliveZero",
    ],
    [
      "Alive is not a number",
      () => withCells(rows, { panelText: panel1, suffix: "/Alive", value: "abc" }),
      "NonNumericCells",
    ],
    [
      "a quadrant is not a number",
      () => withCells(rows, { panelText: panel1, suffix: "PerCP-Vio700-A+", value: "" }),
      "NonNumericCells",
    ],
    [
      "the quadrant sum differs from Alive",
      () => withCells(rows, { panelText: panel1, suffix: "PE-A- , PerCP-Vio700-A-", value: 2001 }),
      "QuadrantSumMismatch",
    ],
    [
      "there are no quadrant rows",
      () => rows.filter((r) => !(r.name.includes(panel1) && /\/Q\d+:/.test(r.name))),
      "NoQuadrantRows",
    ],
  ])("should fail panel 1 with %s and keep panel 2 (%s)", (_, build, code) => {
    const result = analyze(build());
    expect(result.status).toBe("partial");
    if (result.status === "failed") throw new Error("Should not fail");
    expect(result.panels[1].ok).toBe(false);
    if (!result.panels[1].ok) expect(result.panels[1].error[0].code).toBe(code);
    expect(result.panels[2].ok).toBe(true);
  });

  it("should report the group and both values when a quadrant sum differs", () => {
    const changed = withCells(rows, {
      panelText: panel1,
      suffix: "PE-A- , PerCP-Vio700-A-",
      value: 2001,
    });
    const result = sut(changed, 1);
    expect(result).toEqual({
      ok: false,
      error: [{ code: "QuadrantSumMismatch", panel: 1, group: 1, expected: 10000, actual: 10001 }],
    });
    if (!result.ok) {
      expect(toMessage(result.error[0])).toBe(
        "Panel 1: a soma dos quadrantes Q1–Q4 (10001) é diferente do total de Alive (10000).",
      );
    }
  });
});
