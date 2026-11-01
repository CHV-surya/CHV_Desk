import React, { useState } from 'react';
import { Department } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Check, AlertCircle } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onAdd: (data: {
    fullName: string;
    username: string;
    password?: string;
    assignedDepartments: string[];
    status: 'active' | 'inactive';
    email: string;
    role: 'manager' | 'employee';
  }) => { success: boolean; message?: string } | Promise<{ success: boolean; message?: string }>;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  departments,
  onAdd,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'employee'>('employee');
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('employee');
    setAssignedDepartments([]);
    setStatus('active');
    setError(null);
    setIsSubmitting(false);
  };

  const handleToggleDepartment = (deptId: string) => {
    setAssignedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim()) {
      setError('Please fill in both Full Name and Username.');
      return;
    }

    if (assignedDepartments.length === 0) {
      setError('Please assign at least one department.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const generatedEmail = email.trim() || `${username.trim().toLowerCase()}@worktrack.io`;

    setIsSubmitting(true);
    try {
      const result = await onAdd({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        assignedDepartments,
        status,
        email: generatedEmail,
        role,
      });

      setIsSubmitting(false);
      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.message || 'Failed to add employee');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to add employee');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add New Member"
      subtitle={
        role === 'manager'
          ? 'Register a manager and configure supervised department permissions'
          : 'Register an employee and configure department permissions'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection (Prominently placed near the top before Full Name) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Role Selection <span className="text-rose-500">*</span>
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

        {/* Full Name & Username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Surya Sharma"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="e.g. suryas"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. surya.sharma@worktrack.io"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
            />
          </div>
        </div>

        {/* Department Assignment (Multi-selection) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      ? 'border-blue-500 bg-blue-50/80 text-blue-900'
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
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Status */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Status</label>
          <div className="flex items-center gap-5 mt-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={status === 'inactive'}
                onChange={() => setStatus('inactive')}
                className="text-blue-600 focus:ring-blue-500"
              />
              Inactive / Suspended
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
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
            {role === 'manager' ? 'Create Manager' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
