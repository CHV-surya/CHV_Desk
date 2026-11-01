import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DigitalMarketingEntry } from '../../types';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DigitalMarketingEntry | null;
  onUpdate: (
    entryId: string,
    data: {
      contentName?: string;
      videoShoot?: boolean | null;
      editing?: boolean | null;
      clientConfirmation?: boolean | null;
      scheduled?: boolean | null;
      scheduledDate?: string | null;
      adCampaignReportUrl?: string | null;
    }
  ) => Promise<void>;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  onUpdate,
}) => {
  const [contentName, setContentName] = useState('');
  const [videoShoot, setVideoShoot] = useState<'NONE' | 'YES' | 'NO'>('NONE');
  const [editing, setEditing] = useState<'NONE' | 'YES' | 'NO'>('NONE');
  const [clientConfirmation, setClientConfirmation] = useState<'NONE' | 'YES' | 'NO'>(
    'NONE'
  );
  const [scheduled, setScheduled] = useState<'NONE' | 'YES' | 'NO'>('NONE');
  const [scheduledDate, setScheduledDate] = useState('');
  const [adCampaignReportUrl, setAdCampaignReportUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setContentName(entry.contentName || '');
      setVideoShoot(
        entry.videoShoot === true ? 'YES' : entry.videoShoot === false ? 'NO' : 'NONE'
      );
      setEditing(
        entry.editing === true ? 'YES' : entry.editing === false ? 'NO' : 'NONE'
      );
      setClientConfirmation(
        entry.clientConfirmation === true
          ? 'YES'
          : entry.clientConfirmation === false
          ? 'NO'
          : 'NONE'
      );
      setScheduled(
        entry.scheduled === true ? 'YES' : entry.scheduled === false ? 'NO' : 'NONE'
      );
      setScheduledDate(entry.scheduledDate || '');
      setAdCampaignReportUrl(entry.adCampaignReportUrl || '');
      setError(null);
    }
  }, [entry]);

  const parseTriState = (val: 'NONE' | 'YES' | 'NO'): boolean | null => {
    if (val === 'YES') return true;
    if (val === 'NO') return false;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    if (!contentName.trim()) {
      setError('Content title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onUpdate(entry.id, {
        contentName: contentName.trim(),
        videoShoot: parseTriState(videoShoot),
        editing: parseTriState(editing),
        clientConfirmation: parseTriState(clientConfirmation),
        scheduled: parseTriState(scheduled),
        scheduledDate: scheduledDate || null,
        adCampaignReportUrl: adCampaignReportUrl.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${entry.contentType === 'video' ? 'Video' : 'Poster'} Entry`}
      subtitle={`Modify deliverable details and workflow progress`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Content Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Content Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={contentName}
            onChange={(e) => setContentName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium"
            autoFocus
          />
        </div>

        {/* Workflow Dropdowns 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          {/* Video Shoot */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Video Shoot
            </label>
            <select
              value={videoShoot}
              onChange={(e) => setVideoShoot(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer"
            >
              <option value="NONE">- Not Set -</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>

          {/* Editing */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Editing</label>
            <select
              value={editing}
              onChange={(e) => setEditing(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer"
            >
              <option value="NONE">- Not Set -</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>

          {/* Client Confirmation */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Client Confirmation
            </label>
            <select
              value={clientConfirmation}
              onChange={(e) => setClientConfirmation(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer"
            >
              <option value="NONE">- Not Set -</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>

          {/* Scheduled */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Scheduled
            </label>
            <select
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer"
            >
              <option value="NONE">- Not Set -</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </div>

        {/* Date and Report URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ad Campaign Report URL
            </label>
            <input
              type="url"
              value={adCampaignReportUrl}
              onChange={(e) => setAdCampaignReportUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono text-xs"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Update Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};

