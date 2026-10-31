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
    role: 'employee';
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
      setError('Please assign at least one department to the employee.');
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
        role: 'employee',
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
      title="Add New Employee"
      subtitle="Register an employee and configure department permissions"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            Create Employee
          </Button>
        </div>
      </form>
    </Modal>
  );
};
