# Gustra Design Analysis — UI/UX Reference for FlowOps

## 1. Overview and Reference Target

- **Reference URL**: `https://demo.codeandchill.store/gustra/`
- **Application Nature**: High-density, mission-critical operations console (Vite + React SPA with LightningCSS and custom SVG graphics).
- **Captured Viewport Evidence**:
  - Desktop 1440px: [gustra_1440px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1440px.png)
  - Desktop 1280px: [gustra_1280px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1280px.png)
  - Tablet 768px: [gustra_768px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_768px.png)
  - Mobile 390px: [gustra_390px.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_390px.png)
  - Dark Mode: [gustra_1440px_dark.png](file:///d:/Project/DIIXFLOW/docs/reference-analysis/screenshots/gustra/gustra_1440px_dark.png)

---

## 2. Layout & Composition Hierarchy

### 2.1 Sidebar Navigation
- **Expanded Width**: `240px` (`--side-w: 240px`).
- **Rail Mode Width**: `78px` (`--side-rail: 78px`), collapsing automatically below `1280px` or via the `.collapse` toggle button.
- **Surface**: Muted off-white `#f6f6f4` (Light) / `#151615` (Dark).
- **Hairline Border**: `box-shadow: 1px 0 0 var(--line)`.
- **Active Navigation Item**: Surface background `#fbfbfa` with inset hairline border and amber accent highlight.

### 2.2 Topbar & Header
- **Height**: 48px – 56px.
- **Components**: Workspace switcher dropdown with environment pill, global search bar pill, notification counter badge, theme toggler, and user profile avatar with role badge.

### 2.3 Dashboard Grid
- **Maximum Width**: `1520px` (`--max: 1520px`).
- **Page Padding**: `28px` on desktop, `16px` on mobile.
- **Section Gaps**: `16px` (`--gap: 16px`).
- **Multi-Column Flow**: 6-card KPI summary row followed by a 2/3 + 1/3 split layout (throughput chart + live activity stream on the left, urgent approval alerts + reliability rankings on the right).

---

## 3. Design Tokens Extracted from Implementation

### 3.1 Color Palette
- **Light Theme**:
  - Backdrop Canvas (`--bg`): `#f0f0ee`
  - Card Surface (`--card`): `#fbfbfa`
  - Elevated Panel (`--panel`): `#fdfdfc`
  - Primary Text (`--ink`): `#18191b`
  - Secondary Text (`--ink-2`): `#36383b`
  - Muted Text (`--muted`): `#5d6064`
  - Hairline Border (`--line`): `rgba(20, 22, 26, 0.086)`
  - Active Border (`--line-strong`): `rgba(20, 22, 26, 0.16)`
  - Primary Accent (`--accent`): `#f59e0b` / `#f2a516` (Warm Amber Gold)
  - Semantic Status:
    - Success (`--good`): `#1b7647` (Forest Green, Soft: `rgba(27, 118, 71, 0.12)`)
    - Warning (`--warn`): `#9e4a0c` (Warm Ochre, Soft: `rgba(158, 74, 12, 0.12)`)
    - Error (`--bad`): `#b32f37` (Crimson, Soft: `rgba(179, 47, 55, 0.12)`)
    - Info (`--info`): `#0284c7` (Sky Azure, Soft: `rgba(2, 132, 199, 0.12)`)
- **Dark Theme**:
  - Canvas (`--bg`): `#111211` (Deep obsidian)
  - Card (`--card`): `#1a1b1a`
  - Panel (`--panel`): `#1f201f`
  - Primary Text (`--ink`): `#efefec`
  - Border (`--line`): `rgba(240, 240, 232, 0.086)`
  - Accent (`--accent`): `#ffb732`
  - Success: `#63d08f` / `#4fc282`
  - Danger: `#ff8a8a` / `#ff6b6f`

### 3.2 Typography Scale (Urbanist)
- Display Stat: `34px` / Bold (Tabular figures)
- H1 / Page Title: `26px` / SemiBold
- H2 / Section Title: `22px` / SemiBold
- H3 / Card Title: `18px` / SemiBold
- Body Text: `14px` / Regular
- Table Secondary / Code: `12.5px` – `13.5px`
- Badges & Micro-Labels: `11px` – `12px` / SemiBold uppercase

### 3.3 Radii & Elevation
- Inputs / Buttons: `8px` – `10px`
- Small Cards / Dropdowns: `14px`
- Main Cards / Dialogs: `18px`
- Shadows: Inset hairline 1px border combined with subtle diffuse ambient elevation (`0 1px 2px rgba(20, 22, 26, 0.05), 0 10px 24px -18px rgba(30, 30, 30, 0.18)`).

---

## 4. Adaptation into FlowOps

FlowOps preserves Gustra's visual elegance, warm stone backdrop, high-contrast crisp cards, and purposeful status chips, while redirecting all content toward **cloud workflow automation**:
- Turbine status -> Step Functions execution status (`SUCCEEDED`, `RUNNING`, `FAILED`, `WAITING_APPROVAL`).
- Megawatt output -> Hourly execution throughput and SLA success metrics.
- Work order board -> Human-in-the-Loop Approval Queue.
- Weather/sea conditions -> CloudWatch latency, Lambda concurrency, and API integration health.
