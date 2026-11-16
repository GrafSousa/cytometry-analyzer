import { isAlive, panelOf, parseQuadrant } from "@/core/naming";

// Built from code points: a formatter would turn an escape back into an invisible character.
const NO_BREAK_SPACE = String.fromCodePoint(0xa0);
const MINUS_SIGN = String.fromCodePoint(0x2212);

describe("core: panelOf", () => {
  it.each([
    ["1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive", 1],
    ["1.4 BV2 panel 2_24h_exp1.mqd/Cells", 2],
    ["1.4 BV2 Panel 2_24h_exp1.mqd", 2],
    ["1.9 BV2 panel 10_24h_exp1.mqd/Cells", null],
    ["1.9 BV2 panel 12_24h_exp1.mqd/Cells", null],
    ["1.1 BV2 unstained_24h_exp1.mqd/Cells/Single Cells/Alive", null],
    ["1.2 BV2 viobility_24h_exp1.mqd/Cells/Single Cells/Alive", null],
    ["comp-miltenyi-beads_PE.fcs", null],
    ["xpanel 1_abc", null],
  ])("should read %s as panel %s", (name, expected) => {
    expect(panelOf(name)).toBe(expected);
  });
});

describe("core: isAlive", () => {
  it("should accept only the row that ends in /Alive", () => {
    const base = "1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells";
    expect(isAlive(`${base}/Alive`)).toBe(true);
    expect(isAlive(`${base}/Alive/Q1: PE-A- , PerCP-Vio700-A+`)).toBe(false);
    expect(isAlive(base)).toBe(false);
  });
});

describe("core: parseQuadrant", () => {
  const sut = parseQuadrant;

  it("should read the number, the group and each marker's sign", () => {
    const name =
      "1.3 BV2 panel 1_24h_exp1.mqd/Cells/Single Cells/Alive/Q1: PE-A- , PerCP-Vio700-A+";
    expect(sut(name)).toEqual({
      q: 1,
      group: 1,
      markers: [
        { marker: "PE-A", isPositive: false },
        { marker: "PerCP-Vio700-A", isPositive: true },
      ],
    });
  });

  it.each([
    ["Q4", 1],
    ["Q5", 2],
    ["Q8", 2],
    ["Q9", 3],
    ["Q12", 3],
  ])("should put %s in group %i", (q, group) => {
    expect(sut(`x panel 1_y/Alive/${q}: APC-A+ , PE-Vio770-A-`)?.group).toBe(group);
  });

  it("should accept a Unicode minus sign and a non-breaking space", () => {
    expect(
      sut(`x panel 1_y/Alive/Q2:${NO_BREAK_SPACE}PE-A${MINUS_SIGN} , PerCP-Vio700-A+`)?.markers,
    ).toEqual([
      { marker: "PE-A", isPositive: false },
      { marker: "PerCP-Vio700-A", isPositive: true },
    ]);
  });

  it("should reject quadrants outside Q1–Q12 and rows that are not quadrants", () => {
    expect(sut("x panel 1_y/Alive/Q13: PE-A+ , APC-A+")).toBeNull();
    expect(sut("x panel 1_y/Alive")).toBeNull();
  });
});
