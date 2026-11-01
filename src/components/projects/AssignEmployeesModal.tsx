import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { SearchInput } from '../common/SearchInput';
import { api } from '../../lib/api';
import { Users, Check, ShieldAlert, Loader2 } from 'lucide-react';

interface AssignableUser {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  role?: string;
  departmentName?: string;
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

interface AssignEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  departmentName?: string;
  onSaved?: () => void;
}

export const AssignEmployeesModal: React.FC<AssignEmployeesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  departmentName,
  onSaved,
}) => {
  const [employees, setEmployees] = useState<AssignableUser[]>([]);
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

        const [assignablesData, assignmentsData] = await Promise.all([
          api.get<AssignableUser[]>(`/projects/${projectId}/assignable-employees`),
          api.get<ProjectAssignment[]>(`/projects/${projectId}/assignments`),
        ]);

        setEmployees(assignablesData || []);
        const assignedSet = new Set<string>((assignmentsData || []).map((a) => a.userId));
        setSelectedUserIds(assignedSet);
      } catch (err: any) {
        setError(err.message || 'Failed to load project assignees');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, projectId]);

  const handleToggle = (userId: string) => {
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      await api.put(`/projects/${projectId}/assignments`, {
        userIds: Array.from(selectedUserIds),
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update project assignments');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Team Members to Project"
      subtitle={`Configure departmental staff assignments for "${projectName}"`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs sm:text-sm text-blue-900 font-medium">
          Assigned employees will gain direct visibility of this project in their <strong>My Projects</strong> workspace.
        </div>

        <div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search employees by name, @username, or email..."
          />
        </div>

        {/* Selected count pill */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          <span>Eligible Team Members ({employees.length})</span>
          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {selectedUserIds.size} Selected
          </span>
        </div>

        {/* List of assignable employees */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-sm">Loading eligible employees...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No eligible team members found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure employees are assigned to this project's department.
              </p>
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isSelected = selectedUserIds.has(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => handleToggle(emp.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={emp.fullName} size="md" className="w-9 h-9 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        {emp.fullName}
                        {emp.role === 'manager' && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                            MGR
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">
                        @{emp.username} {emp.departmentName && `• ${emp.departmentName}`}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isLoading}
          >
            Save Assignments
          </Button>
        </div>
      </div>
    </Modal>
  );
};
