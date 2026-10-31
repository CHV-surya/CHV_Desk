import React, { useState, useEffect } from 'react';
import { FileText, Save, Check, Clock } from 'lucide-react';
import { Button } from '../common/Button';

interface DailyNotesProps {
  initialNotes: string;
  lastSavedTime?: string;
  onSave: (notes: string) => void | Promise<any>;
  isJoined?: boolean;
}

export const DailyNotes: React.FC<DailyNotesProps> = ({
  initialNotes,
  lastSavedTime,
  onSave,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setIsSaving(false);
    }
  };

  const charCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
            Daily Work Updates & Accomplishments
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
            Document deliverables, tickets completed, reviews, and blockers
          </p>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2.5">
          {lastSavedTime && (
            <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Saved:</span>
              <strong className="font-bold text-slate-800">{lastSavedTime}</strong>
            </span>
          )}

          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="mt-4">
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Completed frontend dashboard UI, refactored state management, resolved layout alignment, and reviewed project specs..."
          className="w-full p-4 text-sm sm:text-[15px] text-slate-800 placeholder-slate-400 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Footer bar with character count and Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs sm:text-[13px] text-slate-500 font-mono">
          <span>
            Chars: <strong className="font-bold text-slate-700">{charCount}</strong>
          </span>
          <span>•</span>
          <span>
            Words: <strong className="font-bold text-slate-700">{wordCount}</strong>
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={isSaving}
          isLoading={isSaving}
          onClick={handleSave}
          icon={<Save className="w-4 h-4" />}
        >
          Save Updates
        </Button>
      </div>
    </div>
  );
};
