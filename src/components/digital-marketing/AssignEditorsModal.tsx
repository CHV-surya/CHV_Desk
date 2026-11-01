import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { SearchInput } from '../common/SearchInput';
import { api } from '../../lib/api';
import { Film, Check, Users, ShieldAlert, Loader2 } from 'lucide-react';

interface VideoEditorUser {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  role?: string;
}

interface ProjectAssignment {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email?: string;
  role: string;
  assignedAt: string;
}

interface AssignEditorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSaved?: () => void;
}

export const AssignEditorsModal: React.FC<AssignEditorsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSaved,
}) => {
  const [editors, setEditors] = useState<VideoEditorUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [editorsData, assignmentsData] = await Promise.all([
          api.get<VideoEditorUser[]>('/digital-marketing/video-editors'),
          api.get<ProjectAssignment[]>(`/digital-marketing/projects/${projectId}/assignments`),
        ]);

        setEditors(editorsData || []);
        const assignedSet = new Set((assignmentsData || []).map((a) => a.userId));
        setSelectedUserIds(assignedSet);
      } catch (err: any) {
        console.error('Failed to load editors or assignments:', err);
        setError(err.message || 'Failed to load video editors');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, projectId]);

  const toggleEditor = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredEditors.map((e) => e.id));
    setSelectedUserIds((prev) => new Set([...prev, ...allIds]));
  };

  const handleClearAll = () => {
    setSelectedUserIds(new Set());
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await api.put(`/digital-marketing/projects/${projectId}/assignments`, {
        userIds: Array.from(selectedUserIds),
      });
      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save assignments:', err);
      setError(err.message || 'Failed to update editor assignments');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEditors = editors.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Video Editors"
      subtitle={`Select Video Editor employees to grant read-only reference access to "${projectName}"`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3 shadow-2xs">
          <Film className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-purple-900 leading-relaxed font-medium">
            <strong>Read-Only Reference Access:</strong> Assigned video editors will see this
            project in their <em>My Projects</em> page and can inspect monthly deliverable
            calendars and targets. They cannot alter monthly targets or edit content entries.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Search & Bulk Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search video editors..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isLoading || filteredEditors.length === 0}
              className="text-xs font-bold text-slate-600 hover:text-purple-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isLoading || selectedUserIds.size === 0}
              className="text-xs font-bold text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {selectedUserIds.size} Selected
            </span>
          </div>
        </div>

        {/* Editors Multi-select List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-xs font-bold">Loading video editors...</span>
            </div>
          ) : editors.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm text-slate-700">No Video Editors Found</p>
              <p className="text-xs text-slate-400 mt-1">
                There are no active employee accounts assigned to the Video Editor department.
              </p>
            </div>
          ) : filteredEditors.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              No editors match "{searchQuery}"
            </div>
          ) : (
            filteredEditors.map((editor) => {
              const isSelected = selectedUserIds.has(editor.id);
              return (
                <div
                  key={editor.id}
                  onClick={() => toggleEditor(editor.id)}
                  className={`flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-purple-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <Avatar name={editor.fullName} size="sm" />

                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {editor.fullName}
                      </span>
                      <span className="block text-xs font-mono text-slate-400 truncate">
                        @{editor.username}
                        {editor.email ? ` • ${editor.email}` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isSelected ? 'Assigned' : 'Not Assigned'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Save Assignments ({selectedUserIds.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
