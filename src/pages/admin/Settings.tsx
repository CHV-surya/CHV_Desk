import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Power,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { api } from '../../lib/api';

export const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    departments,
    addDepartment,
    updateDepartment,
    toggleDepartmentStatus,
    resetToDefaultData,
  } = useData();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Department Modal State
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#3B82F6');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwdFeedback({ text: 'Please enter current admin password.', success: false });
      return;
    }
    if (newPassword.length < 6) {
      setPwdFeedback({ text: 'New password must be at least 6 characters.', success: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ text: 'New passwords do not match.', success: false });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPwdFeedback({ text: 'Admin password updated successfully.', success: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdFeedback({ text: err?.message || 'Failed to change password.', success: false });
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => setPwdFeedback(null), 4000);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    await addDepartment({
      name: newDeptName.trim(),
      slug: newDeptName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newDeptDesc.trim() || 'Custom department stream',
      status: 'active',
      color: newDeptColor,
    });

    setNewDeptName('');
    setNewDeptDesc('');
    setNewDeptColor('#3B82F6');
    setIsAddDeptModalOpen(false);
  };

  const handleRenameDepartment = async (id: string, name: string) => {
    if (!name.trim()) return;
    await updateDepartment(id, { name: name.trim() });
    setEditingDeptId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Organization
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
          Configure departments, security credentials, and application preferences
        </p>
      </div>

      {/* 1. Department Management Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-blue-600" />
              Department Architecture Management
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
              Add new functional units, rename existing ones, or toggle active status
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddDeptModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Department
          </Button>
        </div>

        {/* Departments List */}
        <div className="divide-y divide-slate-100 mt-2">
          {departments.map((dept) => {
            const isEditing = editingDeptId === dept.id;
            return (
              <div
                key={dept.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-slate-100"
                    style={{ backgroundColor: dept.color }}
                  />
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={dept.name}
                          id={`dept-input-${dept.id}`}
                          className="px-3 py-1.5 text-sm border border-blue-500 rounded-xl font-bold text-slate-900 outline-none"
                        />
                        <button
                          onClick={() => {
                            const val = (
                              document.getElementById(`dept-input-${dept.id}`) as HTMLInputElement
                            )?.value;
                            handleRenameDepartment(dept.id, val);
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDeptId(null)}
                          className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px]">{dept.name}</span>
                        <Badge status={dept.status} dot size="md" />
                      </div>
                    )}
                    <p className="text-xs sm:text-[13px] text-slate-400 mt-0.5 font-medium">{dept.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDeptId(dept.id)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Rename
                    </Button>
                  )}
                  <Button
                    variant={dept.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => toggleDepartmentStatus(dept.id)}
                    icon={<Power className="w-3.5 h-3.5" />}
                  >
                    {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Admin Profile & Password Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Administrator Profile
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">Primary system identity & privileges</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.fullName || 'Chandu'}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username / Identifier
              </label>
              <input
                type="text"
                disabled
                value={`@${currentUser?.username || 'admin'}`}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Role & Scope
              </label>
              <div className="flex items-center gap-2.5">
                <Badge variant="purple" size="md">
                  Super Administrator
                </Badge>
                <span className="text-xs text-slate-400 font-medium">Full platform access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" />
              Change Password
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">Update admin authentication phrase</p>
          </div>

          {pwdFeedback && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-[13px] flex items-center gap-2 mb-4 ${
                pwdFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {pwdFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-semibold">{pwdFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="admin123"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" className="w-full">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Application Environment & Demo State Reset */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-blue-600" />
            WorkTrack Environment & Storage
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
            Version 1.2 Enterprise • React, TypeScript, Tailwind CSS, Recharts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {resetSuccess && (
            <span className="text-xs sm:text-[13px] text-emerald-600 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Demo data restored
            </span>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              resetToDefaultData();
              setResetSuccess(true);
              setTimeout(() => setResetSuccess(false), 3000);
            }}
            icon={<RotateCcw className="w-4 h-4 text-slate-500" />}
            className="hover:border-rose-300 hover:text-rose-600"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddDeptModalOpen}
        onClose={() => setIsAddDeptModalOpen(false)}
        title="Add Department"
        subtitle="Introduce an operational unit to the organization"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Quality Assurance"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={newDeptDesc}
              onChange={(e) => setNewDeptDesc(e.target.value)}
              placeholder="Scope and purpose..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newDeptColor}
                onChange={(e) => setNewDeptColor(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <span className="font-mono text-sm font-semibold text-slate-600">{newDeptColor}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
