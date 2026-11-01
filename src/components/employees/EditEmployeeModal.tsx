import React, { useState, useEffect } from 'react';
import { Department, Employee } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Check, AlertCircle, KeyRound } from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  onUpdate: (
    id: string,
    data: Partial<Employee>
  ) => { success: boolean; message?: string } | Promise<{ success: boolean; message?: string }>;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  departments,
  onUpdate,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setUsername(employee.username);
      setEmail(employee.email || '');
      setRole(employee.role);
      setAssignedDepartments(employee.assignedDepartments || []);
      setStatus(employee.status);
      setNewPassword('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [employee, isOpen]);

  if (!employee) return null;

  const handleToggleDepartment = (deptId: string) => {
    setAssignedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim()) {
      setError('Full Name and Username cannot be empty.');
      return;
    }

    if (assignedDepartments.length === 0) {
      setError('Employee must belong to at least one department.');
      return;
    }

    const updates: Partial<Employee> = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      role,
      assignedDepartments,
      status,
    };

    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }

    setIsSubmitting(true);
    try {
      const result = await onUpdate(employee.id, updates);
      setIsSubmitting(false);
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to update employee');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to update employee');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Account Details"
      subtitle={`Configure identity and departments for ${employee.fullName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection — prominent card at the very top */}
        {employee.role !== 'admin' && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
            <label className="block text-sm font-extrabold text-slate-800 mb-2.5 tracking-tight">
              Account Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'employee'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border flex-shrink-0 ${
                    role === 'employee'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {role === 'employee' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 leading-tight">Employee</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium leading-snug">
                    Department team member & task execution
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'manager'
                    ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border flex-shrink-0 ${
                    role === 'manager'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                  {role === 'manager' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 leading-tight flex items-center gap-1.5">
                    Manager
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold leading-none">
                      MANAGER
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium leading-snug">
                    Supervises departments & assigns projects
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Reset Password Optional */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="text-xs sm:text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-1.5">
            <KeyRound className="w-4 h-4 text-blue-600" />
            Reset Password (Optional)
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
          />
        </div>

        {/* Department Assignment (Multi-selection) */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
            Department Assignment <span className="text-rose-500">*</span>
            <span className="font-normal text-slate-400 ml-1.5">(Multi-select enabled)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {departments.map((dept) => {
              const isSelected = assignedDepartments.includes(dept.id);
              return (
                <button
                  type="button"
                  key={dept.id}
                  onClick={() => handleToggleDepartment(dept.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="truncate">{dept.name}</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Status Toggle */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">Account Status</label>
          <div className="flex items-center gap-5 mt-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="editStatus"
                value="active"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="editStatus"
                value="inactive"
                checked={status === 'inactive'}
                onChange={() => setStatus('inactive')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              Deactivated / Suspended
            </label>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
