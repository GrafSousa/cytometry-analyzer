# cytometry-analyzer

A Next.js + TypeScript web app that reads spreadsheets exported by the MACSQuant cytometer (`.xls`, `.xlsx` or `.csv`). For each spreadsheet it computes the percentage of each positive marker relative to the live cells (Alive), separately for panel 1 and panel 2. **Everything runs in the browser:** there is no server and no database, and the files never leave the user's computer.

Start every coding session here. The next steps are in `docs/implementation-plan.md` and the decisions behind the project in `docs/implementation-decisions.md`.

If anything in `docs/` conflicts with the code, ask Gustavo before choosing either way.

## Commands

```bash
pnpm install        # Node 22 (.nvmrc); also installs the Git hooks (Lefthook). SheetJS comes from cdn.sheetjs.com
pnpm dev            # http://localhost:3000
pnpm test           # Vitest
pnpm test:cov       # with coverage
pnpm lint           # ESLint, no warnings allowed
pnpm typecheck      # next typegen + tsc --noEmit
pnpm format         # Prettier
pnpm build          # static site in out/ (output: "export")
```

Gitleaks must be installed for the pre-commit hook: `brew install gitleaks`.

## Business rules (do not change without an explicit request)

1. Use only the **Name** and **#Cells** columns.
2. Consider only the rows with `panel 1_` or `panel 2_` in the name. `panel 10_` does not count. Each panel is computed separately.
3. **100%** = #Cells of the row whose name ends in `/Alive`.
4. The quadrants `.../Alive/Qn: MARKER± , MARKER±` (Q1–Q12) form 3 groups: Q1–Q4, Q5–Q8 and Q9–Q12. Each group adds up to exactly the Alive count.
5. Negative markers (`-`) are ignored. For each positive marker (`+`), sum the #Cells of the quadrants it appears in, within each group.
6. When a marker appears in more than one group (for example `PE-Vio770-A+`), its total is the **mean** of the group sums.
7. % = total ÷ Alive, shown with 2 decimal places in pt-BR format (`94,11%`, `8.664`, `1.798,5`).
8. **Each spreadsheet is independent.** There is never a mean across spreadsheets, and an error in one spreadsheet never affects the others.
9. When a panel is missing, the other one is shown normally next to the error (status `partial`).
10. Up to 50 files per batch.

The possible errors are the `DomainError` union in `src/core/errors.ts`. Each code has a pt-BR message in `src/messages/pt-br.ts` (`errors`), in a table typed by error code: a new code without a message does not compile.

**Every change to a calculation rule requires raising `CALC_VERSION`** in `src/core/types.ts`, which invalidates the cached results.

## Architecture

```
src/core/        pure rules: naming, rows, compute, analyze, search, format, errors, result, types
src/adapters/    sheetjs.ts — the ONLY file that imports "xlsx"
src/services/    process-batch.ts (batch, error isolation) and cache.ts (cache by SHA-256)
src/hooks/       React hooks that hold a component's state (use-batch.ts)
src/components/  React components
src/messages/    pt-br.ts — all UI copy
src/app/         Next.js App Router: layout, page, globals.css
src/tests/       test support: helpers and the fictional example fixture
src/config.ts    app name, tagline and storage prefix
```

- **`src/core` is pure.** It imports no React, Next, SheetJS, `window` or `document`, and nothing from the outer folders (except the copy in `src/messages`). It receives data and returns data. ESLint (`no-restricted-imports`) enforces it.
- **Dependencies point one way:** `app` → `components` → `hooks` → `services` → `adapters` / `core`.
- **Errors are data, not exceptions.** Use `Result<T, E>` (`src/core/result.ts`) and `DomainError`. `processFile` never rejects: any failure becomes a `FileReport` with `status: "failed"`.
- **The spreadsheet reader is injectable.** `processBatch(files, { read, cache, onProgress })` accepts a fake reader in tests. Keep it that way.
- **Cache:** the key is `v{CALC_VERSION}:{sha256 of the content}`. The cache stores results only, never the spreadsheet content.
- The app name lives only in `src/config.ts`. Never write "Planilhas Anna" anywhere else in the code.

## Project rules

- **Everything is in English:** code, comments, commits, pull requests, branch names, file and folder names, and documentation. The only exception is the UI copy, which is pt-BR and lives in `src/messages/pt-br.ts`; never hard-code UI copy in a component.
- **UI copy:** short sentences, addressing the user as "você". Status always written as text (Sucesso, Parcial, Erro, Do cache), never color alone.
- **Accessibility (WCAG 2.2 AA):** one `role="status"` region with the batch summary, real inputs with a `<label>`, visible focus, targets of at least 44 px, and `prefers-reduced-motion` respected.

## Interface and Design System

- Screens: https://claude.ai/artifact/3BkQcc3a7oaZy6YNsKTVD5
- Design System: https://claude.ai/artifact/EWPdcWnjpE2kmqme2tG6Wv
- `src/app/globals.css` is generated from the Design System: the variables come from `tokens.json`, and the `pa-*` classes and the animations from `components/bundle.css`. Use the `pa-*` classes and the variables (`var(--accent)`, `var(--space-4)`…). **Never use loose hex colors in the code.**

## Code quality

- Follow `.claude/skills/code-quality` (Clean Code, SOLID, low coupling, low complexity, Big-O) whenever you write or review code.
- ESLint enforces the limits (cyclomatic complexity 8, cognitive complexity 10, depth 3, 3 parameters, 50 lines per function, 250 per file). Refactor instead of disabling a rule.
- Comments explain why, never what.

## Components

- Follow `.claude/skills/react-components` when creating components or converting a design.
- Kebab-case files, named exports only (except the route files Next.js requires as default exports), `import type` for types, no `React.FC`. ESLint enforces the last three.

## Tests

- Vitest, `*.spec.ts(x)` next to the code they test. Globals are on (`describe`, `it`, `expect` without imports) and `@/` paths resolve from `tsconfig.json`.
- `describe("<kind>: <subject>")` with kinds such as `core`, `adapter`, `service`; `it("should …")`; `sut` for the thing under test.
- One new test for every new rule or error.
- The example spreadsheet (`src/tests/fixtures/example/`) is **fictional**. The expected numbers are in its README.
- **NEVER commit real lab spreadsheets: the repository is public.** To test with real files, put them in `fixtures-local/` (git-ignored); `src/adapters/local-files.spec.ts` reads that folder when it exists. The pre-commit hook blocks any spreadsheet outside the example fixture.

## Workflow

- One branch per plan step, with a pull request for Gustavo to review. Never commit or push directly to `main`.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…), checked by commitlint.
- Never bypass the hooks with `--no-verify`. If a hook fails, fix the cause. `.claude/hooks/guard-git.sh` also blocks these for Claude Code.
- Before opening a pull request: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
- When a step is done, update `docs/implementation-plan.md`.
