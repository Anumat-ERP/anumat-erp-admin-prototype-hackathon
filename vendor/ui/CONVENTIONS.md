# @repo/ui conventions

The rules every component in this package follows. Read this before adding or
changing one; reviewers hold PRs to it.

## Architecture

- **shadcn shape.** We own every component file. Behaviour that has a real
  accessibility contract (dialogs, menus, tabs, tooltips, popovers, checkbox,
  radio, switch, toast, accordion) comes from **Radix** via the `radix-ui`
  package (`import { Dialog } from 'radix-ui'`). Simple elements are plain
  React.
- **Styling is Tailwind utilities against our tokens only.** The theme resets
  Tailwind's default palette and scales, so `bg-blue-500`, `text-gray-600`,
  `rounded-2xl` or `shadow-xl` do not exist here and silently produce nothing.
  Use the semantic names:
  - colours: `bg-surface`, `bg-surface-muted`, `bg-surface-sunken`,
    `bg-surface-hover`, `bg-surface-active`, `bg-surface-selected`,
    `bg-surface-inverse`, `bg-bg`, `bg-overlay`, `bg-skeleton`,
    `border-border`, `border-border-strong`, `border-border-subtle`,
    `border-border-input`, `outline-ring`, `text-fg`, `text-fg-muted`,
    `text-fg-subtle`, `text-fg-disabled`, `text-fg-inverse`, `text-fg-link`,
    and for each tone `primary | critical | success | warning | info`:
    `bg-{tone}`, `bg-{tone}-hover`, `bg-{tone}-active`, `text-{tone}-fg`
    (text on the solid fill), `bg-{tone}-subtle`, `text-{tone}-subtle-fg`,
    `border-{tone}-border`.
  - every colour token works with every colour utility: `fill-*`,
    `stroke-*`, `outline-*`, `decoration-*`, `divide-*`, `ring-*`.
    `border-border-input` meets 3:1 against surfaces (checked by
    build-theme), so use it for control boundaries.
  - type: `text-xs | sm | md | lg | xl | 2xl | 3xl` (body is `text-md`,
    14px), `font-regular | medium | semibold | bold`, `font-sans | mono`,
    `tracking-tight | normal | wide`.
  - space: the 4px grid — `p-1` = 4px, `p-4` = 16px. Control heights:
    `h-control-sm | md | lg` (28 / 36 / 44px); `w-control-*` / `size-control-*`
    for square controls.
  - radius: `rounded-sm | md | lg | xl | full` (controls `md`, cards `lg`).
  - shadow: `shadow-xs | sm | md | lg` (cards `xs`, popovers `md`, dialogs `lg`).
  - motion: `duration-(--a-duration-fast|base|slow)`, `ease-standard | enter | exit`,
    `animate-fade-in | pop-in | slide-in-right | toast-in | spin | pulse`.
  - z-index: `z-(--a-z-index-base|sticky|overlay|modal|dropdown|popover|toast|tooltip)`.
    Menus and popovers sit above modals, so they work when opened inside one.
  - inside a self-contained sticky region (a table), a local stacking order
    `z-1`…`z-3` is fine; use the tokens for anything that overlays the page.
  - durations: `instant | fast | base | slow | slower`.
  - `bg-surface-sunken` is a well *inside* a surface; in dark mode it equals
    the page `bg`, so don't use it to separate something from the page.
  - dark mode is automatic through the tokens; don't write `dark:` variants
    for colours.
- **Focus ring:** `focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-ring` on every interactive element. Inside scrolling
  containers (tab lists, modal bodies, sidebars) use `-outline-offset-2` so the
  ring isn't clipped. Never remove
  focus styles without replacing them.
- **Class composition:** `cn()` from `../lib/cn`. Variants with
  `class-variance-authority` (`cva`) when there are two or more axes.
- **Icons:** `lucide-react`, sized by the parent (`[&_svg]:size-4`), always
  `aria-hidden` unless they are the only content (then the control needs an
  accessible name).
- **No framework imports.** Nothing from `next/*`. Components needing routing
  take an `href` or use `asChild`.
- **Server Components:** any file that uses hooks, event handlers, context,
  browser APIs or stateful Radix primitives (Slot alone doesn't count) starts with `'use client';`. Purely presentational
  files (Text, Stack, Card) stay directive-free so they render on the server.
  The playground's `next build` fails if this is wrong.
- **React 19:** `ref` is a regular prop; use `ComponentPropsWithRef<'x'>` and
  don't use `forwardRef`.

## Files

- One component (and its small parts) per file:
  `src/components/<kebab-name>.tsx`, named exports only.
- One story file beside it: `src/components/<kebab-name>.stories.tsx`.
- Export it from `src/index.ts` and register it in `scripts/manifest.mjs`
  (`STATUS.md` is generated from the manifest — run `bun run status`).
- Tests for behaviour worth pinning: `<kebab-name>.test.tsx` using
  `@repo/testing`: `const { user } = renderWithProviders(<X />)`, then `screen`.

## Docblocks

Every exported component has a JSDoc block saying **what it is, when to use it
and when not to**. Every prop has a JSDoc comment. First-pass components say
so in the docblock (`**First pass** — …`) and in the story description.

## Stories

- `title` follows the taxonomy: `foundations/…`, `primitives/…`,
  `components/…`, `patterns/…`, `product/…`.
- A `Default` story first.
- Every interface state that applies, as its own story:
  `Empty`, `Loading`, `ErrorState` (named `'Error'` — don't shadow the
  global), `Permission`, `Overflow`, `Offline`. Data-bearing components
  (tables, lists, selects, cards with data) carry all six, and **three**
  empties: `EmptyFirstRun` ("create your first…"), `EmptyFiltered` ("no
  results for these filters — clear filters"), `EmptyCleared` ("all done /
  nothing left"). Showing "create your first item" to an empty search reads
  as data loss. Primitives carry the subset that applies (a Button has no
  empty state; it does have loading, error, permission, offline, overflow).
- `argTypes` declared for every prop users set: `control`, `description`,
  and `table.type.summary` with the allowed values. Inference gets names,
  not meanings.
- `parameters.docs.description.component`: when to use it **and when not to**.
- Stories must pass the a11y addon (it runs with `test: 'error'`).

## Semantics we keep

- Numbered lists are `ol`; description lists are real `dl`; progress is a
  real `progress` element; exception lists are `ul`.
- Banners and toasts: `critical` announces assertively, everything else
  politely. Banners use `role="alert"` / `role="status"`; Radix Toast uses
  `type="foreground"` (assertive live region) / `type="background"` (polite).
- Toasts pause their dismiss timer on hover and on focus.
- Settings that submit use a button; a `Switch` means "applies instantly".
- Selectable rows stop checkbox events propagating so selecting doesn't
  also navigate.
- Bulk selection states the count and the scope ("50 selected on this page
  — Select all 1,284"). A header checkbox selects the visible page only.
- Durations show `2:31` and announce "2 minutes 31 seconds"
  (`formatDuration` in `lib/format`).
- Loading buttons keep their box (`loading` prop).
- `text-fg-disabled` is only for the inactive control itself (WCAG exempts
  it). Labels, help text and the *reason* a control is disabled stay readable
  (`text-fg-muted` at least) — an unreadable explanation is no explanation.

## Verification

```bash
bun run --filter @repo/ui check-types   # 0 errors
bun run --filter @repo/ui lint          # 0 errors
bun run --filter @repo/ui test
bun run --filter @repo/ui storybook:build
```
