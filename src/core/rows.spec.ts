import { parseCount, toRows } from "@/core/rows";

// Built from code points: a formatter would turn an escape back into an invisible character.
const NO_BREAK_SPACE = String.fromCodePoint(0xa0);
const NARROW_NO_BREAK_SPACE = String.fromCodePoint(0x202f);

describe("core: parseCount", () => {
  it.each<[unknown, number | null]>([
    [8664, 8664],
    [0, 0],
    ["8664", 8664],
    [" 8664 ", 8664],
    ["8.664", 8664],
    ["8,664", 8664],
    ["8 664", 8664],
    [`8${NARROW_NO_BREAK_SPACE}664`, 8664],
    [`8${NO_BREAK_SPACE}664`, 8664],
    ["", null],
    [null, null],
    ["abc", null],
    ["12,5", null],
    [-3, null],
    [12.5, null],
  ])("should parse %j as %j", (input, expected) => {
    expect(parseCount(input)).toBe(expected);
  });
});

describe("core: toRows", () => {
  const sut = toRows;

  it("should find the header and keep only Name and #Cells, with the original line number", () => {
    const result = sut([
      ["Depth", "Name", "Statistic", "#Cells"],
      [null, "a panel 1_x.mqd", null, 100],
      [null, null, null, null],
      ["> ", "a panel 1_x.mqd/Cells", 80, "90"],
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { line: 2, name: "a panel 1_x.mqd", cells: 100, rawCells: 100 },
        { line: 4, name: "a panel 1_x.mqd/Cells", cells: 90, rawCells: "90" },
      ],
    });
  });

  it("should return MissingColumns when there is no header", () => {
    expect(
      sut([
        ["A", "B"],
        [1, 2],
      ]),
    ).toEqual({ ok: false, error: { code: "MissingColumns", expected: ["Name", "#Cells"] } });
  });
});
