# Project skills

Skills that Claude Code loads for this repository. The third-party ones are copied at a reviewed commit and kept as published, except where noted. Update them through a pull request, after reading the new version.

| Skill | Source | Commit | Changes |
|---|---|---|---|
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/react-best-practices` | `1a2c79d` | None |
| `vercel-composition-patterns` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/composition-patterns` | `1a2c79d` | None |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/web-design-guidelines`; rules from [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines), `command.md` | `1a2c79d` / `434b7f9` | Rules vendored in `guidelines.md` instead of fetched on every run; project overrides for this app |

Skills written for this project:

| Skill | What it covers |
|---|---|
| `code-quality` | Clean Code, SOLID for TypeScript and React, modules and dependency direction (`core` pure, only the adapter imports `xlsx`), complexity, Big-O. ESLint enforces the measurable limits. |
| `react-components` | How to build components here: kebab-case files and named exports, props types, the Design System's `pa-*` classes and tokens, `data-slot` and `data-*` states, copy from `src/messages/pt-br.ts`, accessibility. |
