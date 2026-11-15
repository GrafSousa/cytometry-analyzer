---
name: react-components
description: How to build React components in this project - file names, exports, props types, the design system's pa-* classes and tokens, data-slot and data-* states, accessibility and copy from the message file. Use when creating or changing anything in src/components or src/app, when converting a design (Claude Design page or screenshot) into components, and when reviewing component code.
---

# React components

Components for this app: React 19, TypeScript strict, Next.js static export, styled with the design system's `pa-*` classes and CSS variables.

Other rules live elsewhere and are not repeated here:

- Design System (tokens, components, states, motion): https://claude.ai/artifact/EWPdcWnjpE2kmqme2tG6Wv
- `code-quality` skill: Clean Code, SOLID, complexity limits.
- `vercel-composition-patterns` skill: compound components, no boolean props, React 19 (no `forwardRef`).
- `vercel-react-best-practices` skill: rendering and bundle performance.
- `web-design-guidelines` skill: UI review rules.

## Files and exports

- One component (or one compound family) per file, in `src/components/`, named in kebab case: `upload-area.tsx`, `file-result-card.tsx`.
- **Named exports only.** The exceptions are the files Next.js requires as default exports: `page.tsx`, `layout.tsx` and other route files.
- No barrel `index.ts` in `src/components`. Import from the file: `import { UploadArea } from "@/components/upload-area"`.
- Unit tests next to the component: `search-field.spec.tsx`, with Testing Library.

## Client and server

- The app runs entirely in the browser (files never leave the user's computer), so the page and its interactive parts are Client Components.
- Put `"use client"` on the components that hold state or handlers. Pure display components (`panel-table.tsx`, `app-header.tsx`) do not need it.
- Keep state logic out of the JSX: a component with more than a couple of state values moves them into a hook in `src/hooks/` (`use-batch.ts`).

## Props

- Extend the native element's props when the component wraps one: `ComponentProps<"button">`.
- Use `type`, not an empty `interface`.
- `import type` for types (enforced by ESLint).
- No `React.FC` (enforced by ESLint) and no `any`.
- Take only what you render: `fileName` and `status`, not a whole object for two fields, unless the component really reads most of it (`FileReport` in `FileResultCard`).

## Copy

- **Copy never lives in a component.** All UI text is pt-BR and lives in `src/messages/pt-br.ts`, including `aria-label`s, titles and pluralized strings.
- Components import `messages` from `@/messages/pt-br` and read their own slice (`messages.upload`, `messages.search`). Strings with values are functions in the message file: `messages.search.count(shown, total)`.
- Domain error messages live in `messages.errors`, one entry per `DomainError` code; `toMessage` in `src/core/errors.ts` picks the right one with an exhaustive `switch`.
- Product name and tagline come from `src/config.ts`, never typed elsewhere.

## Styles

- **Only design system classes and tokens.** Use the `pa-*` classes from `src/app/globals.css` and the CSS variables (`var(--accent)`, `var(--space-4)`, `var(--ink-subtle)`).
- **Never** a loose hex color, a magic pixel value or an inline `style` for something a `pa-*` class or token already covers. Inline `style` is only for values computed at runtime (a progress width, the `--i` stagger index).
- Modifiers follow the design system's BEM naming: `pa-button pa-button--primary`, `pa-badge--ok`.
- **Focus:** do not restyle it; `globals.css` already gives every control a visible `:focus-visible` outline. Never remove the outline.
- **Touch targets:** at least 44 × 44px.
- **Motion:** use the design system animations (`pa-enter`); they already stop under `prefers-reduced-motion`.

## Structure

- `data-slot="<name>"` on the root of each component and each compound part: `data-slot="file-result-card"`.
- States as data attributes: `data-dragging={isDragging ? "" : undefined}`, `data-disabled={disabled ? "" : undefined}`.
- Buttons default to `type="button"`.
- Spread `{...props}` last, so callers can add `aria-*`, `id` and event handlers.
- Icons are decorative (`aria-hidden`) and always sit next to text; an icon-only button needs an `aria-label` from the message file.

## Accessibility

- One `role="status"` region announces the batch summary; do not add competing live regions for the same update.
- Real `<input>`s with a `<label>`, never a clickable `div`.
- Status is always written as text (Sucesso, Parcial, Erro, Do cache), never color alone.

## Checklist

1. Kebab-case file in `src/components`, named export, no barrel.
2. `"use client"` only where there is state or a handler; heavy state in a hook.
3. Props as a `type`; copy from `@/messages/pt-br`.
4. Only `pa-*` classes and tokens; no loose hex or pixel values.
5. `data-slot` on every part; states through `data-*`.
6. Focus left to the global outline; touch targets of 44px.
7. Icon-only buttons have an `aria-label`; decorative icons are `aria-hidden`.
8. `type="button"` on buttons; `{...props}` last.
9. A `*.spec.tsx` next to it when it has behavior.
