'use client';

import React, { useState } from 'react';
import { NOTE_TEMPLATES, NoteCategory, NoteTemplate } from '@flowops/contracts';
import {
  FileText,
  ShieldAlert,
  Globe,
  GitBranch,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Plus,
  Search,
  X,
  Code2,
} from 'lucide-react';

interface NotesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFromTemplate: (templateId: string) => void;
  onAddBlankNote: (category: NoteCategory) => void;
}

const CATEGORY_ICONS: Record<NoteCategory, React.ComponentType<{ className?: string }>> = {
  GENERAL: FileText,
  TECHNICAL: Code2,
  API: Globe,
  DATA_MAPPING: GitBranch,
  WARNING: AlertTriangle,
  SECURITY: ShieldAlert,
  TODO: CheckSquare,
  DECISION: HelpCircle,
  CHECKLIST: CheckSquare,
  AI_AUTOMATION: Sparkles,
};

export function NotesLibraryModal({
  isOpen,
  onClose,
  onAddFromTemplate,
  onAddBlankNote,
}: NotesLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'ALL'>('ALL');

  if (!isOpen) return null;

  const filteredTemplates = NOTE_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[var(--ink)]">FlowOps Notes Library</h3>
              <p className="text-[11.5px] text-[var(--muted)]">
                Document architecture, API contracts, security warnings & checklists on canvas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-[var(--line)] space-y-3 bg-[var(--card-2)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g. Security, API, Checklist)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--line-strong)] text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
              }`}
            >
              All Types
            </button>
            {(['GENERAL', 'SECURITY', 'API', 'TODO', 'DECISION', 'WARNING'] as NoteCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredTemplates.map((template) => {
            const Icon = CATEGORY_ICONS[template.category] || FileText;
            return (
              <div
                key={template.id}
                className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-sm transition-all flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center flex-none mt-0.5 text-[var(--accent)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[var(--ink)] truncate">
                        {template.title}
                      </h4>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[var(--card-2)] text-[var(--muted)] border border-[var(--line)]">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--muted)] mt-0.5 line-clamp-1">
                      {template.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddFromTemplate(template.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11.5px] font-bold flex items-center gap-1.5 flex-none hover:opacity-90 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Note</span>
                </button>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-[var(--muted)]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-[13px] font-bold text-[var(--ink)]">No matching templates found</p>
              <p className="text-[11.5px]">Try adjusting your search query or category filter.</p>
            </div>
          )}
        </div>

        {/* Quick Insert Blank Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--card-2)] flex items-center justify-between text-[12px]">
          <span className="text-[var(--muted)] font-medium">Or insert a blank canvas note:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAddBlankNote('GENERAL');
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--card-3)] font-semibold text-[11.5px]"
            >
              + Blank Note
            </button>
            <button
              onClick={() => {
                onAddBlankNote('CHECKLIST');
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--card-3)] font-semibold text-[11.5px]"
            >
              + Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
