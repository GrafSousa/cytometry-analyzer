# Implementation plan

The roadmap for continuing the project in Claude Code. Follow the steps in order, one branch and one pull request per step. The project rules are in `CLAUDE.md`; the decisions behind them in `docs/implementation-decisions.md`.

To start a step in Claude Code, ask, for example:

> Read CLAUDE.md and docs/implementation-plan.md and do Step 2.

## Where we are

- ✅ The full calculation rules, including the PE-Vio770-A+ mean and every error combination.
- ✅ Batch processing with each file isolated, the `ok`, `partial` and `failed` statuses, and the 50-file limit.
- ✅ The content cache (SHA-256 + `CALC_VERSION`), stored in the browser, with the "Limpar cache" button.
- ✅ Search by name: accent-insensitive, several terms, highlighted.
- ✅ Screens following the Design System, with animations.
- ✅ The project standards: skills, Claude Code guardrails, pnpm, ESLint with complexity limits, Prettier, Lefthook, commitlint, CI and Dependabot. Code, tests and docs in English; UI copy in `src/messages/pt-br.ts`.
- ✅ 89 unit tests, including SheetJS reading `.xlsx`, `.xls` (BIFF8) and `.csv` for the first time. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass, and the example spreadsheet shows the expected numbers on screen.

## Step 1: run the project and fix what breaks — done

Done on November 15, 2026, together with the adoption of the project standards: install, typecheck, tests (SheetJS included), static build, and the example spreadsheet checked on screen against `src/tests/fixtures/example/README.md`.

## Step 2: validate with real spreadsheets (without committing them)

Branch: `test/real-spreadsheets`

1. Put real MACSQuant exports in `fixtures-local/`. The folder is git-ignored and **never goes into the repository**; the pre-commit hook also blocks spreadsheets outside the example fixture.
2. `pnpm test`. `src/adapters/local-files.spec.ts` processes each file in the folder and fails on any unexpected error.
3. For each different format found (row names, encoding, CSV separator), add a test in `src/core/` with fictional data that reproduces the case.
4. If an old `.xls` (BIFF5) shows broken accents, turn on the SheetJS codepages (`set_cptable`) in `src/adapters/sheetjs.ts`.

Done when: every available real file is processed as expected.

## Step 3: automatic quality (lint and CI) — mostly done

Done with the project standards: ESLint (instead of the Biome first planned, which lacks the Next.js and full accessibility rules), including the rule that keeps `src/core` pure; Prettier; Lefthook; commitlint; `.github/workflows/ci.yml` with commit messages, Gitleaks, format, lint, typecheck, tests with coverage and build; Dependabot.

Left: turn on a ruleset for `main` on GitHub (pull request required, CI green to merge). The repository is public, so rulesets are enforced even on GitHub Free.

## Step 4: styling with Tailwind CSS and tailwind-variants

Branch: `feat/tailwind-design-system`

Brings the last convention not adopted yet: styling.

1. Tailwind CSS 4 with the Design System tokens as theme variables (`src/styles/tokens.css`), Tailwind's default palette, sizes and radii cleared.
2. Component variants with `tv` from `src/lib/tv.ts`, `Typography` for every heading and paragraph, and the ESLint `react/forbid-elements` rule that blocks bare `h1`–`h6` and `p`.
3. Replace the `pa-*` classes component by component, comparing screenshots before and after.

Decide first: `globals.css` is generated from the Design System today. Either the Design System starts exporting Tailwind tokens, or the tokens are kept by hand in `src/styles/tokens.css`.

## Step 5: interface tests

Branch: `test/e2e`

1. Component tests with Testing Library and jsdom (`// @vitest-environment jsdom`) for `SearchField` (filter, Esc clears, count) and `FileResultCard` (status, Do cache, missing panel).
2. Playwright (`@playwright/test`) + axe, against the static export, `*.e2e-spec.ts` next to the route, covering three scenarios:
   - upload the example spreadsheet and see the percentages;
   - upload a batch with a corrupted file in the middle and see the other spreadsheets computed;
   - upload the same file twice and see the "Do cache" badge.
3. Add Playwright to the pre-push hook and to CI.

## Step 6: publish

Branch: `chore/deploy`

1. GitHub Pages: set `basePath` in `next.config.ts` and add `.github/workflows/deploy.yml` (build → `out/` → Pages).
2. Optional: a single-file HTML version that opens without internet on the lab computers.

## Open items and decisions

- **Product name:** not decided. When it is, change it in `src/config.ts`, in the Design System and on the screens. Do **not** change `storagePrefix` after the app is published, or users lose their cache.
- **Missing quadrant group:** today a group missing entirely (for example no Q9–Q12 rows) is not reported, and the mean uses only the groups present. Decide whether it should be an error.
- **Line numbers in errors:** SheetJS skips blank rows (`blankrows: false`), so the line shown in `NonNumericCells` and `DuplicateAliveRow` can drift from the spreadsheet when there are blank rows.
- **Cache contents:** `NonNumericCells` keeps the raw cell value and the result keeps the Alive row name; both end up in `localStorage`. Small, but at odds with "never the spreadsheet content".
- **Two live regions:** the search count is a second `role="status"` next to the batch summary.
- **Exporting results** (CSV, Excel or PDF): out of scope for now. If it comes in, add a pure `src/core/export.ts` with tests.
- **Web Worker:** only worth it if spreadsheets get large. Reading is already isolated in `src/adapters/sheetjs.ts`, so it is easy to move.
- **Accessibility review** before the first release: screen reader, keyboard only and contrast.
