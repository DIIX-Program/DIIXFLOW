'use client';

import React, { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import {
  FileText,
  ShieldAlert,
  Globe,
  GitBranch,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Pin,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Copy,
  Link as LinkIcon,
  Check,
  Code2,
} from 'lucide-react';
import { NoteCategory, NoteColorTheme } from '@flowops/contracts';

export interface AnnotationNodeData {
  title: string;
  category: NoteCategory;
  color: NoteColorTheme;
  content: string;
  isCollapsed?: boolean;
  isPinned?: boolean;
  linkedNodeIds?: string[];
  tags?: string[];
  onUpdate?: (updated: Partial<AnnotationNodeData>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const CATEGORY_META: Record<
  NoteCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  GENERAL: { label: 'General Note', icon: FileText },
  TECHNICAL: { label: 'Technical Architecture', icon: Code2 },
  API: { label: 'API Contract', icon: Globe },
  DATA_MAPPING: { label: 'Data Mapping', icon: GitBranch },
  WARNING: { label: 'Failure Warning', icon: AlertTriangle },
  SECURITY: { label: 'Security Policy', icon: ShieldAlert },
  TODO: { label: 'TODO Item', icon: CheckSquare },
  DECISION: { label: 'Technical Decision', icon: HelpCircle },
  CHECKLIST: { label: 'Quality Checklist', icon: CheckSquare },
  AI_AUTOMATION: { label: 'AI Automation', icon: Sparkles },
};

const COLOR_THEMES: Record<
  NoteColorTheme,
  {
    border: string;
    bg: string;
    badge: string;
    accent: string;
  }
> = {
  stone: {
    border: 'border-[var(--line-strong)]',
    bg: 'bg-[var(--card)]',
    badge: 'bg-stone-500/15 text-stone-700 dark:text-stone-300',
    accent: 'text-[var(--accent)]',
  },
  blue: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/5 dark:bg-sky-950/20',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    accent: 'text-sky-600 dark:text-sky-400',
  },
  green: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5 dark:bg-amber-950/20',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/5 dark:bg-rose-950/20',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    accent: 'text-rose-600 dark:text-rose-400',
  },
  purple: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/5 dark:bg-violet-950/20',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  cyan: {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/5 dark:bg-cyan-950/20',
    badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  gray: {
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/5 dark:bg-slate-950/20',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    accent: 'text-slate-600 dark:text-slate-400',
  },
};

/**
 * Lightweight safe Markdown and checklist renderer
 */
function MarkdownBody({
  content,
  onToggleChecklist,
}: {
  content: string;
  onToggleChecklist: (lineIndex: number, currentChecked: boolean) => void;
}) {
  const lines = content.split('\n');

  return (
    <div className="text-[12.5px] leading-relaxed text-[var(--ink)] space-y-1.5 font-normal select-text">
      {lines.map((line, idx) => {
        // 1. Checklist item: - [ ] or - [x]
        const checklistMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
        if (checklistMatch) {
          const isChecked = checklistMatch[2].toLowerCase() === 'x';
          const itemText = checklistMatch[3];
          return (
            <div
              key={idx}
              className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onToggleChecklist(idx, isChecked);
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleChecklist(idx, isChecked)}
                className="mt-1 size-3.5 rounded border-[var(--line-strong)] text-[var(--accent)] accent-[var(--accent)] cursor-pointer"
              />
              <span className={`text-[12px] ${isChecked ? 'line-through text-[var(--muted)]' : 'text-[var(--ink)]'}`}>
                {itemText}
              </span>
            </div>
          );
        }

        // 2. Heading: ### or ##
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[13px] font-bold text-[var(--ink)] mt-2 mb-1">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-[14px] font-bold text-[var(--ink)] mt-2 mb-1">
              {line.slice(3)}
            </h3>
          );
        }

        // 3. Bullet item: - or *
        if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
          const text = line.replace(/^(\s*)[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[var(--accent)] font-bold text-[14px] leading-none">•</span>
              <span className="text-[12px]">{renderInlineFormatting(text)}</span>
            </div>
          );
        }

        // 4. Alert / Quote: >
        if (line.startsWith('>')) {
          return (
            <div
              key={idx}
              className="pl-2.5 py-0.5 border-l-2 border-[var(--accent)] italic text-[11.5px] text-[var(--muted)]"
            >
              {line.replace(/^>\s*/, '')}
            </div>
          );
        }

        // 5. Code block delimiter: ```
        if (line.startsWith('```')) {
          return null; // simplified code block
        }

        // 6. Regular paragraph line
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        return (
          <p key={idx} className="text-[12px]">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Convert `code` to mono spans
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1 py-0.2 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--ink)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const AnnotationNoteNode = memo(({ data, selected }: NodeProps) => {
  const noteData = data as unknown as AnnotationNodeData;
  const category = noteData.category || 'GENERAL';
  const colorTheme = noteData.color || 'stone';
  const meta = CATEGORY_META[category] || CATEGORY_META.GENERAL;
  const colors = COLOR_THEMES[colorTheme] || COLOR_THEMES.stone;
  const Icon = meta.icon;

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(noteData.isCollapsed || false);
  const [contentDraft, setContentDraft] = useState(noteData.content || '');
  const [titleDraft, setTitleDraft] = useState(noteData.title || meta.label);

  const handleToggleChecklist = useCallback(
    (lineIndex: number, currentChecked: boolean) => {
      const lines = (noteData.content || '').split('\n');
      if (lines[lineIndex]) {
        lines[lineIndex] = currentChecked
          ? lines[lineIndex].replace(/-\s*\[[xX]\]/, '- [ ]')
          : lines[lineIndex].replace(/-\s*\[\s*\]/, '- [x]');
        const updated = lines.join('\n');
        setContentDraft(updated);
        noteData.onUpdate?.({ content: updated });
      }
    },
    [noteData]
  );

  const handleSaveEdit = () => {
    setIsEditing(false);
    noteData.onUpdate?.({
      title: titleDraft.trim() || meta.label,
      content: contentDraft,
    });
  };

  return (
    <div
      className={`relative rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm shadow-md transition-colors duration-150 p-4 min-w-[280px] max-w-[440px] select-none ${
        selected ? 'ring-2 ring-[var(--accent)]/40 shadow-lg' : ''
      }`}
      style={{ zIndex: selected ? 20 : 1 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={260}
        minHeight={120}
        lineClassName="!border-[var(--accent)]"
        handleClassName="!size-2 !bg-[var(--accent)] !border-none"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-[var(--card)] border border-[var(--line)]">
            <Icon className={`size-3.5 ${colors.accent}`} />
          </div>
          <span
            className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {noteData.isPinned && (
            <span title="Pinned to canvas">
              <Pin className="size-3 text-amber-500 fill-current" />
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
              noteData.onUpdate?.({ isCollapsed: !isCollapsed });
            }}
            className="p-1 rounded hover:bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            title={isCollapsed ? 'Expand Note' : 'Collapse Note'}
          >
            {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1 rounded hover:bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors text-[11px] font-semibold"
            title="Edit Note Content"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Note Title */}
      {isEditing ? (
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleSaveEdit}
          className="w-full text-[13.5px] font-bold text-[var(--ink)] bg-[var(--card)] border border-[var(--line)] rounded-lg px-2 py-1 mb-2 focus:outline-none focus:border-[var(--accent)]"
          placeholder="Note title..."
        />
      ) : (
        <h4 className="text-[13.5px] font-bold text-[var(--ink)] mb-2 tracking-tight">
          {noteData.title || meta.label}
        </h4>
      )}

      {/* Note Body (Collapsible) */}
      {!isCollapsed && (
        <div className="mt-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={contentDraft}
                onChange={(e) => setContentDraft(e.target.value)}
                rows={6}
                className="w-full text-[12px] font-mono text-[var(--ink)] bg-[var(--card)] border border-[var(--line)] rounded-lg p-2.5 focus:outline-none focus:border-[var(--accent)] resize-y"
                placeholder="Markdown formatted notes, checklists (- [ ] task), or architectural decisions..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-md bg-[var(--accent)] text-white text-[11px] font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <MarkdownBody
              content={noteData.content || ''}
              onToggleChecklist={handleToggleChecklist}
            />
          )}
        </div>
      )}

      {/* Linked Nodes Footer Pill */}
      {noteData.linkedNodeIds && noteData.linkedNodeIds.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center gap-1.5 text-[10.5px] text-[var(--muted)]">
          <LinkIcon className="size-3" />
          <span>Linked to {noteData.linkedNodeIds.length} workflow node(s)</span>
        </div>
      )}
    </div>
  );
});
AnnotationNoteNode.displayName = 'AnnotationNoteNode';
