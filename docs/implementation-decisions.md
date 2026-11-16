# Implementation decisions

## Product

- A static Next.js site (`output: "export"`). Everything runs in the browser: the spreadsheets never leave the user's computer, and there is no server or database.
- SheetJS comes from the official tarball at cdn.sheetjs.com, not from the npm `xlsx` package, which stopped at 0.18.5 (2022) with known vulnerabilities. `pnpm audit` does not follow that URL, so check https://cdn.sheetjs.com for new versions from time to time.
- Results are cached by content (SHA-256 of the bytes + `CALC_VERSION`) in `localStorage`, up to 500 entries.

## Project standards

Adopted on November 15, 2026.

### Language

- **Everything is in English:** code, comments, commits, pull requests, branch names, file and folder names, and documentation. The UI stays pt-BR, and all its copy lives in `src/messages/pt-br.ts` (named export `ptBR`).
- Domain error messages moved from a `switch` in `src/core/errors.ts` to the `errors` table in the message file, typed by error code (`{ [Code in DomainError["code"]]: … }`). A missing message is still a compile error, and the lookup keeps `toMessage` under the complexity limit.

### Tooling and guardrails

- **pnpm** pinned in `packageManager`, Node 22 (`.nvmrc`); build scripts allowed one by one in `pnpm-workspace.yaml`.
- **Lefthook:** pre-commit blocks commits on `main`, credential files, **spreadsheets outside the example fixture** (this project only: the repository is public), Gitleaks, Prettier, ESLint and typecheck; commit-msg runs commitlint; pre-push blocks pushes to `main`, then runs the tests and the build.
- **Claude Code:** `.claude/settings.json` runs `.claude/hooks/guard-git.sh` before every Bash call (no commit or push on `main`, no `--no-verify`, no staged `.env`) and denies reading `.env` files and keys.
- **CI (GitHub Actions):** commit messages, Gitleaks, format, lint, typecheck, tests with coverage and build. No e2e or Lighthouse jobs yet (Step 5).
- **Dependabot:** weekly, for npm and GitHub Actions.
- **ESLint instead of Biome**, which the plan first suggested: Biome lacks the Next.js and full `jsx-a11y` rules.

### Code quality

- ESLint limits: cyclomatic complexity 8, cognitive complexity 10, depth 3, 3 parameters, 3 nested callbacks (4 in specs), 50 lines per function (off in specs), 250 lines per file, no nested ternaries, and `sonarjs` rules against duplicated and collapsible code. `no-unused-vars` ignores rest siblings, since `{ id, ...rest }` is how a report drops its identity for the cache.
- **Project-specific lint rules:** `src/core` cannot import React, Next, SheetJS or the outer folders; only `src/adapters/sheetjs.ts` imports `xlsx`.
- Skills in `.claude/skills/`: Vercel's `react-best-practices`, `composition-patterns` and `web-design-guidelines` as published (with project overrides in the last one), plus `code-quality` and `react-components` adapted to this app. See `.claude/skills/README.md`.

### Components

- Kebab-case files, named exports, no barrels, props as `type`, `import type`, no `React.FC`, `data-slot` on component roots, states as `data-*` attributes, `type="button"`.
- The page's state lives in `src/hooks/use-batch.ts`; the page only composes sections.
- **Not adopted yet: styling with Tailwind CSS 4 + `tv` + `Typography`.** This app keeps the Design System's `pa-*` classes for now, because `globals.css` is generated from the Design System. See Step 4 of the plan.
- **Server first does not apply:** the app processes files in the browser, so the page is a Client Component.

### Testing

- Vitest, `*.spec.ts` next to the code, globals on, `@/` paths through `resolve.tsconfigPaths`. Test support in `src/tests/`.
- `describe("<kind>: <subject>")` (`core`, `adapter`, `service`), `it("should …")`, `sut`.
- The default environment is Node (the rules, SheetJS and `crypto.subtle`); a component spec opts into jsdom with a file comment.
- **Invisible characters:** non-breaking spaces in test data are built with `String.fromCodePoint`, because Prettier turns ` ` escapes back into invisible characters. In the code, `\s` already matches U+00A0 and U+202F.
