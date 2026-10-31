import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertCircle, FolderKanban, ShieldCheck } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onRename: (id: string, newName: string, description?: string) => void | Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onRename,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [project, isOpen]);

  if (!project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(project.id, name.trim(), description.trim());
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to update project.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Details"
      subtitle={`Department: ${project.departmentName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dental Care, Instagram Reels, SEO Campaign"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm sm:text-[15px] font-medium text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/60 hover:bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Department Info (Readonly) */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Department Unit
          </label>
          <div className="px-3.5 py-2.5 text-sm font-semibold bg-slate-100/80 border border-slate-200 text-slate-700 rounded-xl">
            {project.departmentName}
          </div>
        </div>

        {/* Description / Deliverables */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Description / Deliverable Focus
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key deliverables, client scope, or sprint focus..."
            className="w-full px-3.5 py-2.5 text-sm sm:text-[15px] font-normal text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/60 hover:bg-slate-50 focus:bg-white transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Permanent Record Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs sm:text-[13px] text-blue-900 leading-snug flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Projects are permanent organizational records exempt from monthly cleanup.</span>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
