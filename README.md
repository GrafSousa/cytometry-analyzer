# cytometry-analyzer

> Working product name: **Planilhas Anna** (set in `src/config.ts`). To keep developing, see `CLAUDE.md` and `docs/implementation-plan.md`.

A web app that reads cytometry spreadsheets exported by the MACSQuant (.xls, .xlsx or .csv), computes the percentage of each positive marker relative to the live cells (Alive) and shows the result for each spreadsheet. The interface is in Brazilian Portuguese.

Everything runs **in the browser**: the files are never sent to a server.

## Running it

Requirements: Node.js 22 (`.nvmrc`), pnpm and, for the pre-commit hook, Gitleaks (`brew install gitleaks`).

```bash
pnpm install    # installs Next.js, React, Vitest, SheetJS (from cdn.sheetjs.com) and the Git hooks
pnpm dev        # opens at http://localhost:3000
pnpm test       # runs the tests
pnpm lint       # ESLint
pnpm typecheck  # checks the types
pnpm build      # writes the static site to out/
```

`out/` can be served by any static host (GitHub Pages, Cloudflare, Netlify, Vercel). For GitHub Pages, set `basePath` in `next.config.ts`.

> SheetJS is **not** installed from the npm `xlsx` package, which stopped at 0.18.5 (2022) with known vulnerabilities. `package.json` points to the official tarball at cdn.sheetjs.com. `pnpm audit` does not track that URL, so check https://cdn.sheetjs.com for new versions from time to time.

## Calculation rules

Each spreadsheet is computed on its own. There is no mean across spreadsheets, and results from different files are never combined.

1. Only the **Name** and **#Cells** columns are used.
2. Only rows with `panel 1_` or `panel 2_` in the name are analyzed (`panel 10_` does not count). Each panel is computed separately.
3. **100%** = #Cells of the row whose name ends in `/Alive`.
4. The quadrant rows (`.../Alive/Q1: PE-A- , PerCP-Vio700-A+` up to Q12) form 3 groups: Q1–Q4, Q5–Q8 and Q9–Q12.
5. Negative markers (ending in `-`) are ignored. For each positive marker (ending in `+`), the #Cells of the quadrants it appears in are summed.
6. When a marker appears in **more than one group** (for example `PE-Vio770-A+` in Q5–Q8 and Q9–Q12), its total is the **mean** of the group sums.
7. % = total ÷ Alive, shown with 2 decimal places.

Example with the fictional spreadsheet in `src/tests/fixtures/example/`, panel 1 (Alive = 10.000):

| Marker          | Quadrants                                    | Cells | % of Alive |
| --------------- | -------------------------------------------- | ----- | ---------- |
| PerCP-Vio700-A+ | Q1 + Q2                                      | 7.500 | 75,00%     |
| PE-A+           | Q2 + Q3                                      | 2.000 | 20,00%     |
| PE-Vio770-A+    | mean of Q5 + Q6 (2.000) and Q9 + Q10 (1.800) | 1.900 | 19,00%     |
| APC-A+          | Q6 + Q7                                      | 5.200 | 52,00%     |
| APC-Vio770-A+   | Q10 + Q11                                    | 500   | 5,00%      |

## Errors and messages

Each spreadsheet gets one of these statuses (shown in Portuguese in the app):

- **Sucesso** (ok): both panels were computed.
- **Parcial** (partial): one panel was computed and the other had an error. The computed panel is shown normally, next to the other one's error.
- **Erro** (failed): no panel could be computed, or the file could not be read.

An error in one spreadsheet never affects the others in the same batch. The errors checked are:

| Code                                    | When                                            |
| --------------------------------------- | ----------------------------------------------- |
| `UnsupportedFormat`                     | Extension other than .xls, .xlsx or .csv        |
| `EmptyFile` / `UnreadableFile`          | Empty or corrupted file                         |
| `MissingColumns`                        | No `Name` and `#Cells` columns                  |
| `MissingPanel`                          | No panel 1 or panel 2 rows                      |
| `MissingAliveRow` / `DuplicateAliveRow` | No `/Alive` row in the panel, or more than one  |
| `NonNumericCells`                       | Empty or non-numeric #Cells                     |
| `AliveZero`                             | Alive = 0                                       |
| `NoQuadrantRows`                        | No Q1–Q12 rows                                  |
| `QuadrantSumMismatch`                   | A group of 4 quadrants does not add up to Alive |

The messages are in `src/messages/pt-br.ts`. Each batch accepts up to 50 files.

## Search by name

With 2 or more spreadsheets in the result, the **Buscar planilha pelo nome** field appears.

- It filters while you type, ignoring case and accents.
- Terms separated by spaces must all appear in the name, in any order: `48h exp1` finds `BV2-48h-exp1.xlsx`.
- The matched text is highlighted, and "Mostrando X de Y planilhas" appears next to the field.
- Esc or the × button clear the search. When nothing matches, a message with a "Limpar busca" button appears.
- The logic is in `src/core/search.ts`, tested in `src/core/search.spec.ts`.

## Cache

A spreadsheet that was already computed is not computed again.

- The cache key is the **SHA-256 fingerprint of the file content** plus the rules version (`CALC_VERSION` in `src/core/types.ts`). The same file under another name comes from the cache; a file with any different byte is recomputed.
- The cache stores **only the result**, never the spreadsheet content. It lives in the browser (`localStorage`), lasts across visits and holds up to 500 spreadsheets; past that, the oldest results are dropped.
- The card shows a **Do cache** badge next to the status, the summary says how many results came from the cache, and the **Limpar cache** button erases everything.
- **When a calculation rule changes, raise `CALC_VERSION`.** That invalidates the old results automatically.
- When storage is full or blocked, the app just recomputes and never breaks because of the cache. Unexpected reader errors are not cached.

## Design

- Screens: https://claude.ai/artifact/3BkQcc3a7oaZy6YNsKTVD5
- Design System (tokens, components, states, motion): https://claude.ai/artifact/EWPdcWnjpE2kmqme2tG6Wv

`src/app/globals.css` is generated from the Design System: the variables come from `tokens.json`, and the `pa-*` classes and the animations from `components/bundle.css`. The animations stop when the operating system asks for less motion (`prefers-reduced-motion`).

## Code layout

```
src/
├─ core/          pure business rules (no React, no SheetJS), easy to test
│  ├─ naming.ts   recognizes the panel, the Alive row and the quadrants by name
│  ├─ rows.ts     finds the header and parses #Cells
│  ├─ compute.ts  computes one panel (sums, mean across groups, checks)
│  ├─ analyze.ts  joins the two panels into one report per file
│  ├─ errors.ts   error codes
│  ├─ format.ts   numbers and percentages in pt-BR format
│  └─ search.ts   search by name (accents, several terms, highlight)
├─ adapters/
│  └─ sheetjs.ts  the only file that uses SheetJS (reads .xls/.xlsx/.csv)
├─ services/
│  ├─ process-batch.ts  processes the files one by one, isolating errors
│  └─ cache.ts          result cache by SHA-256 of the content
├─ hooks/         use-batch.ts: the page's state
├─ components/    app header, upload area, search, batch summary, result card, panel table, icons
├─ messages/      pt-br.ts: all UI copy
├─ tests/         helpers and the FICTIONAL example spreadsheet (.xlsx and the same grid as JSON)
└─ app/           the Next.js page (layout, page, CSS)
```

Each `*.spec.ts` sits next to the code it tests. To change a calculation rule, edit `src/core/compute.ts` and `src/core/compute.spec.ts`, and raise `CALC_VERSION`.
