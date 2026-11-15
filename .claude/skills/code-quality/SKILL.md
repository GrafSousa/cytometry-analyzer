---
name: code-quality
description: This project's code quality rules - Clean Code, SOLID for TypeScript and React, modules with low coupling, low cyclomatic and cognitive complexity, and efficient algorithms. Use when writing, refactoring or reviewing any code in this repository (core, services, adapters, components, tests, config), and when an ESLint complexity or size rule fails.
---

# Code quality

Rules for every line of code in this repository. ESLint enforces the measurable ones; the rest are on you and on review.

## Enforced by ESLint

`eslint.config.mjs` blocks these in the pre-commit hook and in CI:

| Rule | Limit |
|---|---|
| `complexity` (cyclomatic) | 8 per function |
| `sonarjs/cognitive-complexity` | 10 per function |
| `max-depth` | 3 nested blocks |
| `max-params` | 3; group related values in an object |
| `max-nested-callbacks` | 3 (4 in specs) |
| `max-lines-per-function` | 50, blank lines and comments excluded (off in specs) |
| `max-lines` | 250 per file |
| `no-nested-ternary`, `sonarjs/no-nested-conditional` | none |
| `sonarjs/no-collapsible-if`, `no-identical-functions`, `no-identical-conditions`, `no-nested-functions` | none |
| `no-restricted-imports` in `src/core` | no `react`, `next`, `xlsx`, adapters, services or components |

When one fails, refactor. Never raise a limit or add `eslint-disable` to get past it; if a limit is truly wrong, ask Gustavo and change it in `eslint.config.mjs` for everyone.

## Clean Code

- **Names say what a thing is or does.** `aliveRow`, not `a`. Booleans read as questions: `isAlive`, `hasPanel`. Functions are verbs: `parseQuadrant`, `analyzePanel`.
- **Small functions, one job, one level of abstraction.** A function either orchestrates steps or does one step.
- **Early returns** over nested `if`/`else`.
- **No boolean flag parameters** that switch behavior. Write two functions, or a variant for components.
- **No magic values.** Named constants (`MAX_FILES`, `CALC_VERSION`), design tokens for styles, the message file for copy.
- **Comments explain why, never what.** Keep a comment only for a reason the code cannot show (a platform limit, a bug workaround, a business rule's origin).
- **No dead code**, no commented-out code, no unused exports.
- **Pure by default.** `src/core` takes inputs and returns outputs; side effects (files, `localStorage`, `crypto`, DOM) live at the edges: `src/adapters`, `src/services` and the components.
- **Errors are data, not exceptions.** Return `Result<T, E>` with a `DomainError`; never throw for an expected failure.

## SOLID in TypeScript and React

This code base is functional (no classes). SOLID still applies:

- **Single responsibility:** a module or component has one reason to change. Data (messages), rules (`src/core`), I/O (`src/adapters`, `src/services`) and view (`src/components`, `src/app`) stay apart.
- **Open/closed:** extend through variants, `children` and composition, not by adding branches to an existing component. Lookup tables (`Record<ReportStatus, …>`) instead of `switch` chains (the exhaustive `switch` over `DomainError` is the exception: it makes a missing message a compile error).
- **Liskov substitution:** a component that wraps a native element accepts that element's props and behaves like it.
- **Interface segregation:** props and parameters ask only for what they use.
- **Dependency inversion:** high-level code depends on plain data and parameters, not on concrete globals. `processBatch` receives the `read` function and the `cache` instead of importing SheetJS and `localStorage`, which is what makes it testable.

## Modules and coupling

- **Folders have one role each:** `src/app` routes, `src/components` UI, `src/hooks` React hooks that hold a component's logic, `src/services` batch processing and cache, `src/adapters` third-party I/O (SheetJS), `src/core` pure business rules, `src/messages` copy, `src/tests` test support.
- **Dependencies point one way:** `app` → `components` → `hooks` → `services` → `adapters` / `core`. `core` imports nothing from the other folders (except the copy in `src/messages`). No circular imports.
- **Only `src/adapters/sheetjs.ts` imports `xlsx`.**
- **Small public surface:** export only what other modules use. Import from the file that defines a thing; no barrel `index.ts`.

## Complexity

- Replace `if`/`switch` chains with a lookup table or `Record`.
- Extract a condition into a well-named predicate (`isAlive`).
- Use array methods (`find`, `some`, `map`, `filter`) for intent; a plain loop only when it is clearer or measurably faster.
- Split a function when it mixes parsing, deciding and formatting.

## Algorithms and Big-O

- **Know n and how often the code runs.** A spreadsheet has a few hundred rows and a batch at most 50 files; per-row work matters, a single lookup in a short list does not.
- **No accidental O(n²):** no `includes`/`find`/`indexOf` inside a loop over another list. Build a `Set` or `Map` once and look up in O(1).
- **Sort once,** outside loops, and only when order matters.
- **Do not trade clarity for a gain nobody can measure.**
- **Animations:** no layout reads in loops; animate `transform` and `opacity` only.

## Review checklist

1. Does every function do one thing, with a name that says what?
2. Would a reader need a comment to understand it? Then rename or split, unless it is a why.
3. Are any limits close (cyclomatic near 8, function near 50 lines)? Split before it grows.
4. Does any import point the wrong way (`core` → `services`, anything but the adapter → `xlsx`)?
5. Is there a loop inside a loop, or a lookup inside a loop?
6. Are copy, colors, sizes and durations coming from the message file and tokens?
7. Did a calculation rule change? Then `CALC_VERSION` went up.
8. Does a test cover the behavior (`*.spec.ts` next to the code)?
