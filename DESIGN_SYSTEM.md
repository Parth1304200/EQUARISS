# Equaris Design System

Single source of truth for the UI. Every screen and component draws from these
tokens — no ad-hoc hex values, font sizes, radii, or shadows anywhere.

- **Component library:** [shadcn/ui](https://github.com/shadcn-ui/ui), style `base-nova`, built on **Base UI** (`@base-ui/react`) primitives.
- **Icons:** `lucide-react` only. No other icon set. **No emoji anywhere** (UI copy, comments, placeholders, empty states, toasts).
- **Styling:** Tailwind CSS v4 (CSS-first). All tokens live in [`src/index.css`](src/index.css) as CSS variables and are exposed to Tailwind via `@theme inline`.
- **Config:** [`components.json`](components.json). Alias `@` → `src`. Components live in `src/components/ui`.

---

## 1. Color

Semantic tokens only — reference them as Tailwind classes (`bg-primary`,
`text-muted-foreground`, `border-border`, …). Never use raw color utilities
(`bg-red-500`, `text-slate-400`) in rebuilt screens.

| Token | Role | Hue |
|---|---|---|
| `background` / `foreground` | Page base | white / near-black (light), dark stone / near-white (dark) |
| `card` / `card-foreground` | Card & panel surfaces | — |
| `popover` / `popover-foreground` | Menus, tooltips, toasts | — |
| `primary` / `primary-foreground` | Primary actions, active nav, emphasis | **crimson red** `oklch(.505 .213 27.5)` |
| `secondary` / `secondary-foreground` | Secondary buttons/fills | neutral |
| `muted` / `muted-foreground` | Subdued surfaces, helper/label text | stone |
| `accent` / `accent-foreground` | Hover fills, subtle highlights | stone |
| `destructive` | Delete / danger only | red `oklch(.577 .245 27.3)` |
| `border` / `input` / `ring` | Borders, field borders, focus ring | — |
| `chart-1…5` | Data viz series | stone ramp |
| `sidebar*` | Navigation shell surfaces | — |

Every token has a light (`:root`) and dark (`.dark`) value. Contrast pairs meet
WCAG AA. Dark mode is toggled by a `.dark` class on `<html>` (managed in
`AppContext`); the theme switch animates via the body color transition.

**Semantic intent:** success/positive states use `primary` sparingly or a chart
token; `destructive` is reserved strictly for irreversible actions. Do not
introduce green/yellow/cyan one-offs — if a status needs a color, add a token.

---

## 2. Typography

- **Sans (UI + headings):** Inter Variable, self-hosted (`@fontsource-variable/inter`). `font-sans`, and `font-heading` is aliased to it.
- **Mono (numeric / ledger accents, codes, handles):** JetBrains Mono. `font-mono`.

Fixed type scale — never use arbitrary sizes outside it:

| Class | Use |
|---|---|
| `text-xs` (12px) | Labels, captions, metadata, table meta |
| `text-sm` (14px) | Body, form text, table cells, buttons |
| `text-base` (16px) | Default paragraph |
| `text-lg` (18px) | Card titles, section leads |
| `text-xl` (20px) | Sub-headers |
| `text-2xl` (24px) | Page section headers |
| `text-3xl` (30px) | Page titles |
| `text-4xl` / `text-5xl` | Marketing / hero (landing only) |

Weights: 400 body, 500 medium (UI/buttons), 600 semibold (titles), 700–900 for
display/hero only.

---

## 3. Radius

One base radius drives everything: `--radius: 0.625rem` (10px). Derived scale
(`--radius-sm/md/lg/xl/2xl/3xl/4xl`). Use Tailwind `rounded-md` / `rounded-lg` /
`rounded-xl` — never mix sharp and pill corners on peer elements. Default:
inputs/buttons `rounded-lg`, cards `rounded-xl`, pills/badges `rounded-full`.

---

## 4. Elevation — 3 levels max

| Level | Class | Use |
|---|---|---|
| Flat | `border` only (no shadow) | Cards at rest, list rows, inputs |
| Raised | `shadow-sm` | Hover on interactive cards, dropdown triggers |
| Floating | `shadow-md` | Popovers, dialogs, sheets, toasts, command palette |

No other shadow depths. Dark mode leans on `border` (white-alpha) more than
shadow for separation.

---

## 5. Spacing

Tailwind's 4px scale. Common rhythm: `gap-2` (dense groups), `gap-3`/`gap-4`
(within cards), `gap-6`/`gap-8` (between sections). Card padding `p-6`; dense
cells `p-3`/`p-4`. Use **logical properties** (`ps-`, `pe-`, `ms-`, `me-`) so
layouts stay RTL-safe.

---

## 6. Motion

One easing: `--ease-standard` = `cubic-bezier(0.4, 0, 0.2, 1)` (app-wide
default). Durations: **150ms** micro (hover/focus), **250ms** standard (default;
modals, toggles), **400ms** page-level (route/page transitions). Motion is
functional only — state changes, enter/exit, loading. No decorative loops.

---

## 7. Icons

`lucide-react`, consistent stroke, sized by context:

- **16px** (`size-4`) in dense UI — buttons, inputs, table cells, badges. (Baked into `Button`/inputs by default.)
- **20px** (`size-5`) default standalone icons.
- **24px** (`size-6`) headers, nav, empty-state glyphs.

Icons must clarify or aid scanning — never decorative filler. Every icon that
replaced an emoji must carry the same meaning the emoji did.

---

## 8. Component rules

- All buttons/inputs/dialogs/etc. come from `src/components/ui/*` — no bespoke re-styles per screen.
- Interactive elements: explicit `cursor-pointer`; disabled: `cursor-not-allowed` + `opacity-50` (built into primitives).
- Every clickable element has visible `hover` **and** `focus-visible` states (keyboard nav must work).
- Destructive actions → `AlertDialog` confirmation, never a bare button.
- Async buttons → in-button loading (spinner icon + disabled), not a global spinner.
- Every async surface has explicit **loading** (`Skeleton`) and **error** (`Alert`/toast) states — never a silent hang.
- Empty states → icon + one line of copy + a clear next action. Never a blank panel.
- Transient feedback → `sonner` toasts; persistent inline → `Alert`.

## 9. Installed primitives

`button, card, badge, input, textarea, label, select, separator, skeleton,
avatar, tooltip, dropdown-menu, dialog, sheet, tabs, scroll-area, progress,
sonner, alert, alert-dialog`. Add more per-screen with
`npx shadcn@latest add <name>` as needed (data-table, command, popover,
calendar, chart, sidebar, …).

## 10. Migration status

Rebuild order: **auth → dashboard → core (groups, group-detail, settlements) →
network → reports → profile/settings**. Until a screen is migrated it still uses
the transitional `slate-*` grayscale overrides in `index.css`; those overrides
are deleted once every screen is on semantic tokens.
