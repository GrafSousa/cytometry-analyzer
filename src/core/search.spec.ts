import { filterByName, highlight, matchesQuery, normalizeText, searchTerms } from "@/core/search";

const files = [
  "BV2-24h-exp1.xls",
  "BV2-24h-exp2.xls",
  "BV2-48h-exp1.xlsx",
  "Microglia-72h-exp1.csv",
  "Anotações finais.txt",
].map((fileName, i) => ({ id: String(i), fileName }));

const matchedTexts = (name: string, query: string) =>
  highlight(name, query)
    .filter((s) => s.isMatch)
    .map((s) => s.text);

describe("core: normalizeText and searchTerms", () => {
  it("should drop accents and case", () => {
    expect(normalizeText("Anotações ÉXP")).toBe("anotacoes exp");
  });

  it("should split the terms and ignore extra spaces", () => {
    expect(searchTerms("  48h   Exp1 ")).toEqual(["48h", "exp1"]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("core: matchesQuery", () => {
  it.each([
    ["BV2-48h-exp1.xlsx", "48h", true],
    ["BV2-48h-exp1.xlsx", "48H", true],
    ["BV2-48h-exp1.xlsx", "exp1 48h", true],
    ["BV2-48h-exp1.xlsx", "48h exp2", false],
    ["Anotações finais.txt", "anotacoes", true],
    ["Anotacoes finais.txt", "anotações", true],
    ["BV2-24h-exp1.xls", "", true],
  ])('should match %s with "%s": %s', (name, query, expected) => {
    expect(matchesQuery(name, query)).toBe(expected);
  });
});

describe("core: filterByName", () => {
  const sut = filterByName;

  it("should return everything, in the same order, for an empty query", () => {
    expect(sut(files, "").map((f) => f.id)).toEqual(["0", "1", "2", "3", "4"]);
  });

  it("should filter and keep the original order", () => {
    expect(sut(files, "exp1").map((f) => f.fileName)).toEqual([
      "BV2-24h-exp1.xls",
      "BV2-48h-exp1.xlsx",
      "Microglia-72h-exp1.csv",
    ]);
  });

  it("should return nothing when no name matches", () => {
    expect(sut(files, "48h-exp9")).toEqual([]);
  });
});

describe("core: highlight", () => {
  const sut = highlight;

  it("should mark the matched segment", () => {
    expect(sut("BV2-48h-exp1.xls", "48h")).toEqual([
      { text: "BV2-", isMatch: false },
      { text: "48h", isMatch: true },
      { text: "-exp1.xls", isMatch: false },
    ]);
  });

  it("should mark every term and every occurrence", () => {
    expect(matchedTexts("exp1-exp1", "exp1")).toEqual(["exp1", "exp1"]);
    expect(matchedTexts("BV2-48h-exp1.xls", "exp1 bv2")).toEqual(["BV2", "exp1"]);
  });

  it("should highlight the original accented text", () => {
    expect(sut("Anotações.txt", "coes")).toEqual([
      { text: "Anota", isMatch: false },
      { text: "ções", isMatch: true },
      { text: ".txt", isMatch: false },
    ]);
  });

  it("should give back the original name when the segments are joined", () => {
    const name = "Ação_ÉXP-1 (cópia).xls";
    expect(
      sut(name, "acao cop")
        .map((s) => s.text)
        .join(""),
    ).toBe(name);
  });

  it("should return one unmarked segment for an empty query", () => {
    expect(sut("abc.xls", "")).toEqual([{ text: "abc.xls", isMatch: false }]);
  });
});
