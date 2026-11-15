# FlowOps Design System Specification

## 1. Design Philosophy & Foundations

FlowOps adopts an **Industrial Precision** design philosophy:
- Built for engineers, cloud architects, and operations teams managing mission-critical automation.
- Rooted in the visual hierarchy, warm tones, and high-density legibility of **Gustra**.
- Enhanced with the node-graph interactions, contextual drawers, and execution state feedback inspired by **n8n**.
- Strict elimination of gimmicks: no gratuitous glassmorphism, no rainbow gradients, no inconsistent paddings, and no ungrounded decorative animations.

---

## 2. Color System

FlowOps provides native **Light** and **Dark** themes utilizing semantic CSS variables.

### 2.1 Core Palette Tokens

| Semantic Token | Light Mode Value | Dark Mode Value | Purpose |
|---|---|---|---|
| `--color-bg` | `#f0f0ee` | `#111211` | Application backdrop canvas |
| `--color-surface` | `#fbfbfa` | `#1a1b1a` | Standard card and table row background |
| `--color-surface-elevated` | `#fdfdfc` | `#1f201f` | Modals, drawers, popovers, dropdowns |
| `--color-sidebar-bg` | `#f6f6f4` | `#151615` | Navigation sidebar background |
| `--color-card-subtle` | `rgba(24, 25, 27, 0.035)` | `rgba(240, 240, 232, 0.04)` | Nested panels, code blocks, table zebra |
| `--color-card-hover` | `rgba(24, 25, 27, 0.07)` | `rgba(240, 240, 232, 0.08)` | Interactive row/card hover fill |
| `--color-text-primary` | `#18191b` | `#efefec` | Headings, primary metrics, active labels |
| `--color-text-secondary` | `#36383b` | `#d0d0cb` | Body copy, secondary labels, parameters |
| `--color-text-muted` | `#5d6064` | `#9e9f99` | Timestamps, placeholders, inactive icons |
| `--color-border-subtle` | `rgba(20, 22, 26, 0.086)` | `rgba(240, 240, 232, 0.086)` | Standard hairline borders (1px) |
| `--color-border-strong` | `rgba(20, 22, 26, 0.16)` | `rgba(240, 240, 232, 0.16)` | Active inputs, selected node borders |
| `--color-accent` | `#f59e0b` (Amber) | `#ffb732` (Amber) | Primary brand accent & highlights |
| `--color-accent-soft` | `rgba(245, 158, 11, 0.14)` | `rgba(255, 183, 50, 0.15)` | Selected tab pill, active badge fill |
| `--color-success` | `#1b7647` (Forest Green) | `#4fc282` | Execution succeeded, health OK |
| `--color-success-soft` | `rgba(27, 118, 71, 0.12)` | `rgba(79, 194, 130, 0.14)` | Succeeded badge background |
| `--color-warning` | `#b45309` (Warm Ochre) | `#f59e0b` | Retries, degraded status, timeouts |
| `--color-warning-soft` | `rgba(180, 83, 9, 0.12)` | `rgba(245, 158, 11, 0.14)` | Warning badge background |
| `--color-error` | `#b91c1c` (Crimson) | `#ef4444` | Execution failed, validation error |
| `--color-error-soft` | `rgba(185, 28, 28, 0.12)` | `rgba(239, 68, 68, 0.14)` | Error badge background |
| `--color-info` | `#0284c7` (Sky Azure) | `#38bdf8` | In-progress, webhooks, documentation |
| `--color-info-soft` | `rgba(2, 132, 199, 0.12)` | `rgba(56, 189, 248, 0.14)` | Info badge background |

### 2.2 Workflow Node Category Colors
Each node category in the FlowOps editor has a consistent accent identifier:
- **Triggers (Entry Points)**: Emerald Green (`#10b981`)
- **Actions (Tasks & HTTP)**: Electric Azure (`#0284c7`)
- **Logic & Branching (Conditions)**: Royal Indigo (`#6366f1`)
- **Human Approval Gate**: Radiant Amber (`#f59e0b`)
- **Terminal Success**: Forest Green (`#15803d`)
- **Terminal Failure**: Crimson Red (`#b91c1c`)
- **Wait & Delays**: Slate / Cool Gray (`#64748b`)

---

## 3. Typography System

FlowOps uses **Urbanist** as the primary font family for dashboard clarity and high-aesthetic technical typography, with **JetBrains Mono** / `ui-monospace` for JSON payloads, expressions, and execution logs.

### 3.1 Type Scale

```css
--font-sans: 'Urbanist', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

| Scale Token | Font Size | Line Height | Weight | Typical Application |
|---|---|---|---|---|
| `text-display` | `34px` | `1.15` | 700 / Bold | Hero KPI figures, summary statistics |
| `text-3xl` | `26px` | `1.2` | 600 / SemiBold | Page titles, major modal headers |
| `text-2xl` | `22px` | `1.25` | 600 / SemiBold | Section headings, panel titles |
| `text-xl` | `18px` | `1.3` | 600 / SemiBold | Card titles, drawer headers |
| `text-lg` | `15px` | `1.4` | 500 / Medium | Prominent table titles, node titles |
| `text-base` | `14px` | `1.5` | 400 / Regular | Standard body copy, inputs, forms |
| `text-sm` | `13px` | `1.45` | 500 / Medium | Table cell data, descriptions, badges |
| `text-xs` | `12px` | `1.4` | 600 / SemiBold | Table headers, chip filters, timestamps |
| `text-2xs` | `11px` | `1.35` | 600 / SemiBold | Micro status pills, port labels |

---

## 4. Spacing, Radii & Shadows

### 4.1 Spacing Scale
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px` (Standard layout gap)
- `space-5`: `20px`
- `space-6`: `24px`
- `space-8`: `32px` (Section padding)
- `space-10`: `40px`

### 4.2 Layout Dimensions
- **Sidebar Width (Expanded)**: `240px`
- **Sidebar Width (Rail Mode)**: `78px`
- **Header Height**: `56px`
- **Canvas Toolbar Height**: `52px`
- **Node Configuration Panel Width**: `420px`
- **Bottom Execution Panel Height**: `280px` (Collapsible to `38px`)
- **Maximum Page Width**: `1520px`

### 4.3 Border Radii
- `rounded-sm`: `8px` (Inputs, sub-badges, dropdown items)
- `rounded-md`: `10px` (Action buttons, chips, filter tabs)
- `rounded-lg`: `14px` (Small cards, popovers, node headers)
- `rounded-xl`: `18px` (Main cards, modal dialogs, workflow nodes)
- `rounded-2xl`: `24px` (Canvas containers, large preview shells)

### 4.4 Elevation & Shadows
- **Cards & Surfaces**: Hairline 1px inset border + diffuse ambient shadow:
  ```css
  box-shadow: inset 0 0 0 1px var(--color-border-subtle), 0 1px 2px rgba(20, 22, 26, 0.05), 0 10px 24px -18px rgba(30, 30, 30, 0.15);
  ```
- **Modals & Drawers**: Deep floating elevation:
  ```css
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 30px 60px -20px rgba(0, 0, 0, 0.25);
  ```

---

## 5. Component Specifications

### 5.1 Buttons
- **Primary Button**: Accent Amber (`#f59e0b`) background, ink text (`#18191b`), font-weight 600, height 38px, radius 10px. Hover: subtle brightness +10%.
- **Secondary Button**: Surface background (`var(--color-surface)`), hairline inset border, text primary. Hover: `var(--color-card-hover)`.
- **Ghost Button**: Transparent background, text secondary. Hover: `var(--color-card-subtle)`.
- **Destructive Button**: Crimson soft background, text `#b91c1c`. Hover: solid crimson `#b91c1c` with white text.
- **Icon Button (`.ibtn`)**: Fixed 42px x 42px (or 34px x 34px compact), 10px–13px radius, hairline border.

### 5.2 Form Inputs & Controls
- **Text / Number Input**: Height 38px, radius 10px, background `var(--color-surface)`, border `var(--color-border-subtle)`. Focus: ring 2px `var(--color-accent)`.
- **Select / Dropdown**: Height 38px, chevron icon, options rendered in elevated panel with 10px radius and 4px padding.
- **Switch / Toggle**: 40px width, 22px height, pill shape, smooth spring transition.
- **Key-Value Pair Editor**: Clean two-column table for HTTP headers, query parameters, and payload properties.

### 5.3 KPI & Metric Cards
- Container: 18px radius, 18px 20px padding, surface background with inset hairline border.
- Layout:
  1. Header: Metric Title (12px, semi-bold, muted) + category icon.
  2. Stat: 34px bold figure with tabular digits.
  3. Footer: Trend badge (green `+14.2%` or red `-3.1%`) with contextual timeframe label (`vs previous 24h`).

### 5.4 Data Tables
- Header: Sticky top row, font-size 12px, uppercase, muted text, border-bottom 1px solid hairline.
- Rows: Hover background highlight (`var(--color-card-hover)`), cell padding 12px 16px, border-bottom 1px solid `var(--color-border-subtle)`.
- Status Cell: Inline pill badge with filled dot indicator.
- Action Menu: Right-aligned 3-dots icon button triggering contextual actions (Edit, Duplicate, Execute, Archive).

### 5.5 Workflow Node Cards (React Flow)
- Width: `280px` standard.
- Border radius: `14px`.
- Background: `var(--color-surface)`.
- Border: 1px solid `var(--color-border-subtle)` (Selected: 2px solid `var(--color-accent)`).
- Header: Category color accent pill, icon, title, and optional status badge.
- Body: 2-line preview of primary parameters.
- Ports:
  - Input: Left centered handle, 10px circle with 2px stroke.
  - Output: Right centered handle (or stacked `True` / `False` handles for conditions).

---

## 6. Interaction & Accessibility Standards

- **Focus Visibility**: All interactive controls have distinct `:focus-visible` outlines (2px accent with 2px offset).
- **Contrast**: Text-to-background contrast ratio meets or exceeds **WCAG 2.2 AA** (>= 4.5:1 for body copy, >= 3.0:1 for large display text).
- **Reduced Motion**: All animations respect `prefers-reduced-motion: reduce`.
- **Keyboard Navigation**:
  - Full tab traversal across forms, tables, and modal controls.
  - Canvas shortcuts: `Space + Drag` to pan, `Delete / Backspace` to remove selected node/edge, `Ctrl/Cmd + Z` undo, `Ctrl/Cmd + Shift + Z` redo, `Ctrl/Cmd + S` save.
