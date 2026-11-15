"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  FolderInput,
  Globe,
  Inbox,
  Layers,
  Palette,
  Tag,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MenuRow = {
  id: string;
  label: string;
  icon?: LucideIcon;
  initials?: string;
  tint?: string;
  dot?: string;
  hint?: string;
  panel?: MenuPanel;
  danger?: boolean;
};

export type MenuPanel = { search?: string; rows: MenuRow[] };

export const defaultRootPanel: MenuPanel = {
  rows: [
    {
      id: "invite",
      label: "Invite people",
      icon: UserPlus,
      hint: "@",
      panel: {
        search: "Find people",
        rows: [
          { id: "priya", label: "Priya Raman", initials: "PR", tint: "#a8c7ff" },
          { id: "noah", label: "Noah Whitfield", initials: "NW", tint: "#ffd6a5" },
          { id: "ines", label: "Ines Duarte", initials: "ID", tint: "#b9f0d0" },
        ],
      },
    },
    {
      id: "move",
      label: "Move to",
      icon: FolderInput,
      hint: "M",
      panel: {
        search: "Find a space",
        rows: [
          {
            id: "roadmap",
            label: "Roadmap",
            icon: Layers,
            panel: {
              search: "Find a board",
              rows: [
                { id: "quarter", label: "Quarter planning", initials: "QP", tint: "#a8c7ff" },
                { id: "bets", label: "Platform bets", initials: "PB", tint: "#d9c2ff" },
                { id: "hiring", label: "Hiring plan", initials: "HP", tint: "#ffd6a5" },
                { id: "launch", label: "Launch checklist", initials: "LC", tint: "#b9f0d0" },
              ],
            },
          },
          {
            id: "system",
            label: "Design system",
            icon: Palette,
            panel: {
              search: "Find a board",
              rows: [
                { id: "tokens", label: "Colour tokens", initials: "CT", tint: "#ffc9d4" },
                { id: "specs", label: "Component specs", initials: "CS", tint: "#a8c7ff" },
                { id: "icons", label: "Icon set", initials: "IS", tint: "#b9f0d0" },
              ],
            },
          },
          { id: "site", label: "Marketing site", icon: Globe },
          { id: "support", label: "Support inbox", icon: Inbox },
        ],
      },
    },
    {
      id: "label",
      label: "Set label",
      icon: Tag,
      hint: "L",
      panel: {
        rows: [
          { id: "priority", label: "Priority", dot: "#ff9c9c" },
          { id: "blocked", label: "Blocked", dot: "#ffd6a5" },
          { id: "research", label: "Research", dot: "#a8c7ff" },
          { id: "shipped", label: "Shipped", dot: "#b9f0d0" },
        ],
      },
    },
    { id: "duplicate", label: "Duplicate", icon: Copy, hint: "⌘D" },
    { id: "archive", label: "Archive", icon: Archive },
  ],
};

const ROW_HEIGHT = 28;
const PANEL_MS = 380;
const CLOSE_MS = 220;

export const panelKeyframes = `
@keyframes glide-menu-in {
  0% { opacity: 0; transform: translateX(100%); filter: blur(8px); }
  45% { opacity: .9; }
  65% { filter: blur(6.5px); }
  100% { opacity: 1; transform: translateX(0); filter: blur(0); }
}
@keyframes glide-menu-out {
  0% { opacity: 1; transform: translateX(0); filter: blur(0); }
  30% { opacity: .9; filter: blur(6px); }
  100% { opacity: 0; transform: translateX(-100%); filter: blur(9px); }
}
@keyframes glide-menu-in-back {
  0% { opacity: 0; transform: translateX(-100%); filter: blur(8px); }
  45% { opacity: .9; }
  65% { filter: blur(6.5px); }
  100% { opacity: 1; transform: translateX(0); filter: blur(0); }
}
@keyframes glide-menu-out-back {
  0% { opacity: 1; transform: translateX(0); filter: blur(0); }
  30% { opacity: .9; filter: blur(6px); }
  100% { opacity: 0; transform: translateX(100%); filter: blur(9px); }
}`;

const phaseClass = {
  idle: "",
  in: "[animation:glide-menu-in_.36s_cubic-bezier(.45,.05,.15,1)_both] motion-reduce:[animation-duration:.01ms]",
  "in-back": "[animation:glide-menu-in-back_.36s_cubic-bezier(.45,.05,.15,1)_both] motion-reduce:[animation-duration:.01ms]",
  out: "absolute inset-x-0 top-0 [animation:glide-menu-out_.36s_cubic-bezier(.45,.05,.15,1)_both] motion-reduce:animate-none motion-reduce:opacity-0",
  "out-back": "absolute inset-x-0 top-0 [animation:glide-menu-out-back_.36s_cubic-bezier(.45,.05,.15,1)_both] motion-reduce:animate-none motion-reduce:opacity-0",
};

export function stepAtPanel(basePanel: MenuPanel, trail: string[]) {
  let panel = basePanel;
  let title = "";
  for (const id of trail) {
    const row = panel.rows.find((candidate) => candidate.id === id);
    if (!row?.panel) break;
    panel = row.panel;
    title = row.label;
  }
  return { panel, title };
}

function matches(panel: MenuPanel, query: string) {
  const term = query.trim().toLowerCase();
  return term ? panel.rows.filter((row) => row.label.toLowerCase().includes(term)) : panel.rows;
}

function MenuPanelContent({
  panel,
  title,
  phase,
  query,
  panelRef,
  searchRef,
  onQuery,
  onSelect,
  onBack,
}: {
  panel: MenuPanel;
  title: string;
  phase: keyof typeof phaseClass;
  query: string;
  panelRef?: RefObject<HTMLDivElement | null>;
  searchRef?: RefObject<HTMLInputElement | null>;
  onQuery?: (value: string) => void;
  onSelect?: (row: MenuRow) => void;
  onBack?: () => void;
}) {
  const [cursor, setCursor] = useState({ index: 0, visible: false });
  const rows = matches(panel, query);
  const leaving = phase === "out" || phase === "out-back";

  return (
    <div className={`w-full ${phaseClass[phase]}`} ref={panelRef} inert={leaving || undefined}>
      {title && (
        <>
          <div className="flex h-[28px] items-center gap-[6px] px-1 pr-[5px]">
            <button
              type="button"
              className="grid size-5 flex-none place-items-center rounded-md border-0 bg-transparent text-[var(--muted)] transition-colors hover:bg-[var(--card-2)] hover:text-[var(--ink)] focus-visible:outline-none"
              onClick={onBack}
              aria-label={`Back from ${title}`}
            >
              <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
            </button>
            {panel.search ? (
              <input
                ref={searchRef}
                className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-[11.5px] font-medium text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                data-search=""
                type="text"
                value={query}
                placeholder={panel.search}
                aria-label={panel.search}
                onChange={(event) => onQuery?.(event.target.value)}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-[var(--ink)]">
                {title}
              </span>
            )}
          </div>
          <div className="my-1 h-px bg-[var(--line)]" />
        </>
      )}
      <div
        className="relative"
        role="menu"
        onMouseLeave={() => setCursor((state) => ({ ...state, visible: false }))}
      >
        <span
          className={`pointer-events-none absolute inset-x-0 top-0 h-[28px] rounded-lg bg-[var(--card-2)] border border-[var(--line)] transition-all duration-150 ease-out ${
            cursor.visible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `translateY(${cursor.index * ROW_HEIGHT}px)` }}
          aria-hidden="true"
        />
        {rows.map((row, index) => (
          <button
            key={row.id}
            type="button"
            role="menuitem"
            className={`group relative z-[1] flex h-[28px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left text-[11.5px] font-medium transition-colors ${
              row.danger
                ? "text-[var(--bad)] hover:text-[var(--bad)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            } focus-visible:outline-none`}
            data-row=""
            aria-haspopup={row.panel ? "menu" : undefined}
            onMouseEnter={() => setCursor({ index, visible: true })}
            onFocus={() => setCursor({ index, visible: true })}
            onClick={() => onSelect?.(row)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" && row.panel) {
                event.preventDefault();
                onSelect?.(row);
              }
            }}
          >
            {row.icon && (
              <span
                className={`grid size-[15px] flex-none place-items-center ${
                  row.danger ? "text-[var(--bad)]" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
                } transition-colors`}
              >
                <row.icon size={14} strokeWidth={1.8} aria-hidden="true" />
              </span>
            )}
            {row.initials && (
              <span
                className="grid size-[18px] flex-none place-items-center rounded-md text-[9px] font-bold text-white shadow-sm"
                style={{ background: row.tint }}
                aria-hidden="true"
              >
                {row.initials}
              </span>
            )}
            {row.dot && (
              <span
                className="mx-1 size-2 flex-none rounded-full ring-2 ring-white/10"
                style={{ background: row.dot }}
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            {row.hint && (
              <span className="flex-none font-mono text-[10px] text-[var(--muted)] px-1 py-0.5 rounded bg-[var(--card)]/60 border border-[var(--line)]">
                {row.hint}
              </span>
            )}
            {row.panel && (
              <ChevronRight
                className="flex-none text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ink)]"
                size={13}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </button>
        ))}
        {!rows.length && (
          <p className="m-0 flex h-[28px] items-center px-2 text-[11px] text-[var(--muted)]">
            No matches
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Standard triggerable BlurGlideMenu (Demo / Toolbar dropdown)
 */
export function BlurGlideMenu({
  panel = defaultRootPanel,
  buttonLabel = "Board actions",
  onSelectAction,
}: {
  panel?: MenuPanel;
  buttonLabel?: string;
  onSelectAction?: (actionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nav, setNav] = useState<{ trail: string[]; direction: -1 | 0 | 1 }>({ trail: [], direction: 0 });
  const [query, setQuery] = useState("");
  const [leaving, setLeaving] = useState<{ trail: string[]; query: string; direction: -1 | 1 } | null>(null);
  const [height, setHeight] = useState<number>();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const step = stepAtPanel(panel, nav.trail);

  useEffect(() => {
    if (activeRef.current) setHeight(activeRef.current.offsetHeight);
  }, [nav, query, open]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(null), PANEL_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setNav({ trail: [], direction: 0 });
      setQuery("");
      setLeaving(null);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const enter = (id: string) => {
    setLeaving({ trail: nav.trail, query, direction: 1 });
    setNav({ trail: [...nav.trail, id], direction: 1 });
    setQuery("");
  };

  const back = () => {
    if (!nav.trail.length) return;
    setLeaving({ trail: nav.trail, query, direction: -1 });
    setNav({ trail: nav.trail.slice(0, -1), direction: -1 });
    setQuery("");
  };

  const dismiss = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="relative inline-block text-[11px] text-[var(--ink)]" ref={rootRef}>
      <style>{panelKeyframes}</style>
      <button
        type="button"
        className="inline-flex h-[30px] items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 text-[11.5px] font-semibold text-[var(--ink)] transition-all hover:bg-[var(--card-2)] shadow-sm"
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? dismiss() : setOpen(true))}
      >
        <span>{buttonLabel}</span>
        <ChevronDown
          className={`text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={13}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="absolute right-0 top-[36px] z-50 w-[220px] origin-top-right rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-1.5 text-left shadow-2xl backdrop-blur-xl">
          <div className="relative overflow-hidden transition-[height] duration-200" style={{ height }}>
            {leaving && (
              <MenuPanelContent
                key={leaving.trail.join("/") || "root"}
                {...stepAtPanel(panel, leaving.trail)}
                phase={leaving.direction === 1 ? "out" : "out-back"}
                query={leaving.query}
              />
            )}
            <MenuPanelContent
              key={nav.trail.join("/") || "root"}
              {...step}
              phase={nav.direction === 0 ? "idle" : nav.direction === 1 ? "in" : "in-back"}
              query={query}
              panelRef={activeRef}
              searchRef={step.panel.search ? searchRef : undefined}
              onQuery={setQuery}
              onBack={back}
              onSelect={(row) => {
                if (row.panel) {
                  enter(row.id);
                } else {
                  onSelectAction?.(row.id);
                  dismiss();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * High-performance Context Menu driven by BlurGlideMenu animations
 * Opens directly at (x, y) coordinates on right click
 */
export interface BlurGlideContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  panel: MenuPanel;
  onSelectAction: (actionId: string) => void;
}

export function BlurGlideContextMenu({
  x,
  y,
  isOpen,
  onClose,
  panel,
  onSelectAction,
}: BlurGlideContextMenuProps) {
  const [nav, setNav] = useState<{ trail: string[]; direction: -1 | 0 | 1 }>({ trail: [], direction: 0 });
  const [query, setQuery] = useState("");
  const [leaving, setLeaving] = useState<{ trail: string[]; query: string; direction: -1 | 1 } | null>(null);
  const [height, setHeight] = useState<number>();
  const menuRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const step = stepAtPanel(panel, nav.trail);

  // Reset navigation when opened
  useEffect(() => {
    if (isOpen) {
      setNav({ trail: [], direction: 0 });
      setQuery("");
      setLeaving(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeRef.current) setHeight(activeRef.current.offsetHeight);
  }, [nav, query, isOpen]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(null), PANEL_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  // Handle escape and arrow navigation
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (nav.trail.length) {
        back();
      } else {
        onClose();
      }
    }
  };

  const enter = (id: string) => {
    setLeaving({ trail: nav.trail, query, direction: 1 });
    setNav({ trail: [...nav.trail, id], direction: 1 });
    setQuery("");
  };

  const back = () => {
    if (!nav.trail.length) return;
    setLeaving({ trail: nav.trail, query, direction: -1 });
    setNav({ trail: nav.trail.slice(0, -1), direction: -1 });
    setQuery("");
  };

  if (!isOpen) return null;

  // Viewport bounds clamping (menu width ~224px, max height ~320px)
  const clampedX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 240) : x;
  const clampedY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - 340) : y;

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onPointerDown={(e) => {
        if (!menuRef.current?.contains(e.target as Node)) {
          onClose();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <style>{panelKeyframes}</style>
      <div
        ref={menuRef}
        onKeyDown={handleKeyDown}
        style={{ top: `${clampedY}px`, left: `${clampedX}px` }}
        className="absolute w-[228px] rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-black/10 animate-in fade-in-0 zoom-in-95 duration-150"
      >
        <div
          className="relative overflow-hidden transition-[height] duration-200"
          style={{ height: height || 'auto' }}
        >
          {leaving && (
            <MenuPanelContent
              key={leaving.trail.join("/") || "root"}
              {...stepAtPanel(panel, leaving.trail)}
              phase={leaving.direction === 1 ? "out" : "out-back"}
              query={leaving.query}
            />
          )}
          <MenuPanelContent
            key={nav.trail.join("/") || "root"}
            {...step}
            phase={nav.direction === 0 ? "idle" : nav.direction === 1 ? "in" : "in-back"}
            query={query}
            panelRef={activeRef}
            searchRef={step.panel.search ? searchRef : undefined}
            onQuery={setQuery}
            onBack={back}
            onSelect={(row) => {
              if (row.panel) {
                enter(row.id);
              } else {
                onSelectAction(row.id);
                onClose();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
