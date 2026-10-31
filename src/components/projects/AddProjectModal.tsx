import React, { useState } from 'react';
import { Department } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  defaultDepartmentId?: string;
  onAdd: (data: {
    name: string;
    departmentId: string;
    description?: string;
  }) => void | Promise<any>;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  departments,
  defaultDepartmentId,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || departments[0]?.id || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid project name.');
      return;
    }
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        departmentId,
        description: description.trim(),
      });
      setIsSubmitting(false);
      resetForm();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to create project');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Register Permanent Project"
      subtitle="Create an immutable project record for your department"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dental Care, Instagram Reels, SEO Campaign"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Department <span className="text-rose-500">*</span>
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-medium"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Description / Deliverable Focus
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key deliverables, client scope, or sprint focus..."
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs sm:text-[13px] text-blue-900 leading-snug flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Projects are permanent records exempt from monthly activity purge.</span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isSubmitting}
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
