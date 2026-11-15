# Gustra Reference Analysis

## 1. Overview and Source Reference

- **Reference URL**: `https://demo.codeandchill.store/gustra/#/overview`
- **Application Type**: High-density Enterprise Operations Dashboard (SPA with hash routing, built with Vite, React, LightningCSS, and custom SVG visualizers).
- **Core Visual Motif**: Premium European industrial & operations SaaS. Muted warm stone backdrop, high-contrast crisp cards, hairline inset borders, refined typography, and purposeful semantic status indicators.
- **Reference Screenshots Captured**:
  - Desktop 1440px: [gustra_1440px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1440px.png)
  - Desktop 1280px: [gustra_1280px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1280px.png)
  - Tablet 768px: [gustra_768px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_768px.png)
  - Mobile 390px: [gustra_390px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_390px.png)
  - Dark Mode 1440px: [gustra_1440px_dark.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1440px_dark.png)

---

## 2. Layout & Spatial Hierarchy

### 2.1 Shell Structure
- **Sidebar**:
  - Expanded Width: `240px` (`--side-w: 240px`).
  - Collapsed / Rail Width: `78px` (`--side-rail: 78px`).
  - Background: `#f6f6f4` (Light) / `#151615` (Dark).
  - Border: 1px right solid hairline (`box-shadow: 1px 0 0 var(--line)`).
  - Navigation padding: `16px 14px 14px` (expanded) vs `16px 12px 14px` (rail).
  - Behavior: Collapses automatically on viewports `< 1280px` into an icon-rail with tooltips. Full overlay drawer on mobile (`< 768px`).
- **Main Content Area**:
  - Max Width: `1520px` (`--max: 1520px`).
  - Page Padding: `28px` (`--pad: 28px`) on desktop, scaling to `16px` on tablet/mobile.
  - Section & Grid Gaps: `16px` (`--gap: 16px`).
  - Header / Topbar: Sleek minimal header, 48px–56px height, housing workspace switcher, search pill, notification counter, and user profile avatar.

### 2.2 Responsive Breakpoints
- **1440px+**: 3-column operational layout (`ov-row--three`), full metric cards, multi-column analytics, live timeline table.
- **1280px**: 2-column or 3-column condensed grid with rail sidebar (`78px`).
- **768px (Tablet)**: Single column flow, collapsible filter drawers, horizontal scrolling tables with sticky key columns.
- **390px (Mobile)**: Single column stacked KPI cards, compact metric chips, bottom navigation bar or hamburger sheet.

---

## 3. Design Tokens Extracted from Implementation

### 3.1 Typography
- **Font Family**: `"Urbanist", system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Type Scale**:
  | Token | Computed Size | Usage |
  |---|---|---|
  | `--fs-display` | `34px` | Hero KPIs, large operational values |
  | `--fs-4xl` | `26px` | Page headers, primary modal titles |
  | `--fs-3xl` | `22px` | Section titles, major card headers |
  | `--fs-2xl` | `20px` | Card headers, modal headings |
  | `--fs-xl` | `17px` | Sub-section headers |
  | `--fs-lg` | `15px` | Prominent body, table primary cells |
  | `--fs-base` | `14px` | Standard body text, form inputs |
  | `--fs-md` | `13.5px`| Secondary body, table data cells |
  | `--fs-sm` | `12.5px`| Filter chips, status tags, timestamps |
  | `--fs-xs` | `12px` | Table headers, small labels |
  | `--fs-2xs` | `11px` | Micro badges, system indicators |

### 3.2 Color Tokens

#### Light Theme
- **Backdrop Canvas (`--bg`)**: `#f0f0ee` (Warm, non-glaring off-white/gray)
- **Card Surface (`--card`)**: `#fbfbfa`
- **Elevated Panel (`--panel`)**: `#fdfdfc`
- **Sidebar Surface (`--side-bg`)**: `#f6f6f4`
- **Primary Ink (`--ink`)**: `#18191b` (Deep charcoal, not harsh pure black)
- **Secondary Ink (`--ink-2`)**: `#36383b`
- **Muted Ink (`--muted`)**: `#5d6064`
- **Hairline Border (`--line`)**: `#14161a16` (8.6% alpha charcoal)
- **Active Border (`--line-2`)**: `#14161a29` (16% alpha charcoal)
- **Primary Accent (`--accent`)**: `#f2a516` (Warm amber gold), gradient `#f6b53c` to `#e99a0a`
- **Status Success (`--good`, `--st-running`)**: `#1b7647` / `#2f9a5e` (Soft bg: `#1b8c501f`)
- **Status Warning (`--warn`, `--st-derated`)**: `#9e4a0c` / `#dd7a1e` (Soft bg: `#d66e1424`)
- **Status Danger/Fault (`--bad`, `--st-fault`)**: `#b32f37` / `#d23f45` (Soft bg: `#c832371a`)
- **Status Info/Service (`--info`, `--st-service`)**: `#285d9e` / `#3d78c2` (Soft bg: `#2864aa1c`)
- **Status Idle/Stopped (`--st-stopped`)**: `#a3a7ab`

#### Dark Theme
- **Backdrop Canvas (`--bg`)**: `#111211` (Deep matte obsidian)
- **Card Surface (`--card`)**: `#1a1b1a`
- **Elevated Panel (`--panel`)**: `#1f201f`
- **Sidebar Surface (`--side-bg`)**: `#151615`
- **Primary Ink (`--ink`)**: `#efefec`
- **Secondary Ink (`--ink-2`)**: `#d0d0cb`
- **Muted Ink (`--muted`)**: `#9e9f99`
- **Hairline Border (`--line`)**: `#f0f0e816`
- **Active Border (`--line-2`)**: `#f0f0e829`
- **Primary Accent (`--accent`)**: `#ffb732`
- **Status Success**: `#63d08f` / `#4fc282` (Soft bg: `#63d08f24`)
- **Status Warning**: `#f2a05c` / `#f0954a` (Soft bg: `#f2a05c26`)
- **Status Danger**: `#ff8a8a` / `#ff6b6f` (Soft bg: `#ff8a8a24`)
- **Status Info**: `#84b3f2` / `#6aa2ea` (Soft bg: `#84b3f224`)

### 3.3 Radii & Shadows
- **Radii**:
  - `--r-sm`: `10px` (Buttons, chips, inputs, badges)
  - `--r-md`: `14px` (Small cards, dropdowns, popovers)
  - `--r-lg`: `18px` (Main cards, modal dialogs)
  - `--r-xl`: `24px` (Large container wrappers)
- **Shadows**:
  - Light mode uses a subtle inset border combined with diffuse ambient elevation:
    - `--shadow-sm`: `0 1px 2px #14161a0d`
    - `--shadow`: `0 1px 2px #14161a0d, 0 10px 26px -18px #1e1e1e52`
    - Card border: `box-shadow: inset 0 0 0 1px var(--line), var(--shadow)`
  - Dark mode uses deeper ambient shadows without harsh glows:
    - `--shadow`: `0 1px 2px #0006, 0 14px 32px -20px #000c`

---

## 4. Component Patterns & Rules

### 4.1 KPI & Metric Cards
- Container has `border-radius: 18px`, `padding: 18px 20px 20px`, surface `var(--card)`, inset line border.
- Layout: Top row contains metric label (`--fs-xs`, uppercase or muted semi-bold) and an action/status pill.
- Center row contains big numeric stat (`--fs-display`, 34px, weight 700, letter-spacing -0.02em).
- Bottom row contains delta badge (e.g. `+8.2% vs yesterday` with green/red pill) and mini trend indicator.

### 4.2 Interactive Tables
- Wrapper: `.table-wrap` with horizontal scroll and hairline border.
- Header row: `.table th` has `font-size: 12px`, uppercase, `color: var(--muted)`, `font-weight: 600`, padding `10px 14px`, 1px solid bottom border.
- Data rows: `.table td` has `font-size: 13.5px`, color `var(--ink)`, padding `12px 14px`, hover background `var(--card-2)`.
- Status cells: Inline badge chip (height `26px`, radius `8px`, font-size `11.5px`, subtle icon + text).

### 4.3 Action Controls & Buttons
- **Standard Button (`.btn`)**: height `38px`, padding `0 16px`, radius `10px`, font-size `13.5px`, font-weight `600`.
- **Icon Button (`.ibtn`)**: width/height `42px`, radius `13px`, inset 1px line border, centered icon.
- **Small Icon Button (`.ibtn--sm`)**: width/height `34px`, radius `10px`.
- **Chips / Filter Tags**: height `32px`, padding `0 12px`, radius `10px`, inset 1px line, active state filled with primary accent soft tone.

---

## 5. Translation to FlowOps Cloud Orchestration Platform

To satisfy the specification requirement:
> *"Preserve the valuable visual characteristics of Gustra, but translate them into a cloud automation product. Do not use offshore wind farm content, terminology, or imagery as FlowOps product content."*

| Gustra Element | FlowOps Equivalent |
|---|---|
| Offshore Farm Turbines (48 units) | Cloud Workflows & Active Step Function Executions |
| Active Megawatts & Wind Output | Total Executions, Throughput, and Success Rates |
| Sea State & Wave Height | AWS Service Latency & Lambda Concurrency |
| Work Order Board / Tasks | Approval Inbox & Pending Human-in-the-Loop Actions |
| Alarms & Vessel Timeline | Execution Failures, DLQ Warnings, and Execution History |
| Turbine Status Badges (Running/Fault/Derated) | Step Function States: `RUNNING`, `SUCCEEDED`, `FAILED`, `WAITING_APPROVAL` |
| Gustra Amber Gold Accent (`#f2a516`) | FlowOps Precision Tech Accent (Electric Amber `#f59e0b` / Cloud Azure `#0284c7` hybrid) |

This visual identity provides an authoritative, data-dense, mission-critical operations console for enterprise workflow automation.
