import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { DigitalMarketingEntry, DmContentType } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface ContentSectionTableProps {
  title: string;
  contentType: DmContentType;
  entries: DigitalMarketingEntry[];
  target: number;
  onAddEntry: () => void;
  onEditEntry: (entry: DigitalMarketingEntry) => void;
  onQuickUpdateStatus?: (
    entryId: string,
    field: 'videoShoot' | 'editing' | 'clientConfirmation' | 'scheduled',
    value: boolean | null
  ) => void;
  onDeleteEntry: (entryId: string) => void | Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const ContentSectionTable: React.FC<ContentSectionTableProps> = ({
  title,
  contentType,
  entries,
  target,
  onAddEntry,
  onEditEntry,
  onQuickUpdateStatus,
  onDeleteEntry,
  isLoading = false,
  isReadOnly = false,
}) => {
  const [deleteCandidate, setDeleteCandidate] = useState<DigitalMarketingEntry | null>(
    null
  );

  const completedCount = entries.filter((e) => e.scheduled === true).length;

  // Helper to render YES / NO / Not Set badge or dropdown
  const renderStatusDropdown = (
    entry: DigitalMarketingEntry,
    field: 'videoShoot' | 'editing' | 'clientConfirmation' | 'scheduled',
    currentVal: boolean | null
  ) => {
    if (isReadOnly) {
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
            currentVal === true
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : currentVal === false
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          {currentVal === true ? 'YES' : currentVal === false ? 'NO' : '-'}
        </span>
      );
    }

    return (
      <select
        value={currentVal === true ? 'YES' : currentVal === false ? 'NO' : 'NONE'}
        disabled={isLoading || !onQuickUpdateStatus}
        onChange={(e) => {
          const val = e.target.value;
          const boolVal = val === 'YES' ? true : val === 'NO' ? false : null;
          if (onQuickUpdateStatus) {
            onQuickUpdateStatus(entry.id, field, boolVal);
          }
        }}
        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
          currentVal === true
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
            : currentVal === false
            ? 'bg-rose-50 text-rose-700 border-rose-300'
            : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}
      >
        <option value="NONE">-</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-xs">
      {/* Section Header Banner with Orange Styling */}
      <div className="px-5 py-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-black tracking-wider uppercase drop-shadow-xs">
            {title}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-white/20 text-white backdrop-blur-md border border-white/30">
            {entries.length} Added {target > 0 ? `/ ${target} Target` : ''}
          </span>
          {completedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-white border border-emerald-300/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedCount} Scheduled
            </span>
          )}
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onAddEntry}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-orange-600 hover:bg-orange-50 active:bg-orange-100 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add {contentType === 'video' ? 'Video' : 'Poster'}
          </button>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-orange-50/80 border-b border-orange-200 text-xs font-extrabold text-orange-950 uppercase tracking-wider">
              <th className="py-3.5 px-5 min-w-[220px]">
                {contentType === 'video' ? 'Video Content' : 'Poster Content'}
              </th>
              <th className="py-3.5 px-3.5 text-center min-w-[110px]">Video Shoot</th>
              <th className="py-3.5 px-3.5 text-center min-w-[100px]">Editing</th>
              <th className="py-3.5 px-3.5 text-center min-w-[140px]">
                Client Confirmation
              </th>
              <th className="py-3.5 px-3.5 text-center min-w-[110px]">Scheduled</th>
              <th className="py-3.5 px-3.5 text-center min-w-[120px]">Budget</th>
              <th className="py-3.5 px-3.5 text-center min-w-[130px]">Date</th>
              <th className="py-3.5 px-4 min-w-[220px]">Ad Campaign Report</th>
              {!isReadOnly && <th className="py-3.5 px-5 text-right min-w-[100px]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 8 : 9} className="py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-400 mb-3 shadow-2xs">
                      <Sparkles className="w-6 h-6 text-orange-400" />
                    </div>
                    <p className="font-bold text-slate-700 text-base">
                      No {title} Recorded
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
                      Plan your monthly content deliverables and track production workflow.
                    </p>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={onAddEntry}
                        disabled={isLoading}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        Add First {contentType === 'video' ? 'Video' : 'Poster'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const isValidUrl =
                  entry.adCampaignReportUrl &&
                  (entry.adCampaignReportUrl.startsWith('http://') ||
                    entry.adCampaignReportUrl.startsWith('https://'));

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-orange-50/20 transition-colors group"
                  >
                    {/* 1. Content Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs text-slate-400 font-bold mt-0.5">
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {entry.contentName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Video Shoot */}
                    <td className="py-3.5 px-3.5 text-center">
                      {renderStatusDropdown(entry, 'videoShoot', entry.videoShoot)}
                    </td>

                    {/* 3. Editing */}
                    <td className="py-3.5 px-3.5 text-center">
                      {renderStatusDropdown(entry, 'editing', entry.editing)}
                    </td>

                    {/* 4. Client Confirmation */}
                    <td className="py-3.5 px-3.5 text-center">
                      {renderStatusDropdown(
                        entry,
                        'clientConfirmation',
                        entry.clientConfirmation
                      )}
                    </td>

                    {/* 5. Scheduled */}
                    <td className="py-3.5 px-3.5 text-center">
                      {renderStatusDropdown(entry, 'scheduled', entry.scheduled)}
                    </td>

                    {/* 6. Budget */}
                    <td className="py-3.5 px-3.5 text-center font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                      {entry.budget !== null && entry.budget !== undefined && entry.budget !== '' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ₹{Number(entry.budget).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 7. Date */}
                    <td className="py-3.5 px-3.5 text-center font-mono text-xs text-slate-600 font-medium whitespace-nowrap">
                      {entry.scheduledDate ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {entry.scheduledDate}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 8. Ad Campaign Report URL */}
                    <td className="py-3.5 px-4">
                      {entry.adCampaignReportUrl ? (
                        isValidUrl ? (
                          <a
                            href={entry.adCampaignReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline max-w-[200px] truncate"
                            title={entry.adCampaignReportUrl}
                          >
                            <span className="truncate">
                              {entry.adCampaignReportUrl.replace(/^https?:\/\//, '')}
                            </span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <span
                            className="text-xs text-slate-600 max-w-[200px] truncate block"
                            title={entry.adCampaignReportUrl}
                          >
                            {entry.adCampaignReportUrl}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* 8. Actions */}
                    {!isReadOnly && (
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            disabled={isLoading}
                            title="Edit Entry"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(entry)}
                            disabled={isLoading}
                            title="Delete Entry"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={async () => {
          if (deleteCandidate) {
            await onDeleteEntry(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title={`Delete ${contentType === 'video' ? 'Video' : 'Poster'} Entry`}
        message={`Are you sure you want to remove "${deleteCandidate?.contentName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
};

