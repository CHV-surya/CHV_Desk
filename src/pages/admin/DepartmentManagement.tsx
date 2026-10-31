import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, FolderKanban, Activity, ArrowRight, Edit2, Power } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Department } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const DepartmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { departments, employees, projects, activities, addDepartment, updateDepartment, toggleDepartmentStatus } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // New Department form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addDepartment({
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      status: 'active',
      color,
    });

    setName('');
    setDescription('');
    setColor('#3B82F6');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editName.trim()) return;

    await updateDepartment(editingDept.id, {
      name: editName.trim(),
      description: editDescription.trim(),
    });

    setEditingDept(null);
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Operational Department Units
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              {departments.length} Units
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Configure functional business units, project streams, and team allocations
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptEmployees = employees.filter((e) =>
            e.assignedDepartments.includes(dept.id)
          );
          const deptProjects = projects.filter((p) => p.departmentId === dept.id);
          const isDeptActive = dept.status === 'active';

          return (
            <div
              key={dept.id}
              className={`glass-card glass-card-hover rounded-2xl p-5 sm:p-6 transition-all flex flex-col justify-between ${
                isDeptActive ? 'border-t-4' : 'opacity-70 bg-slate-50/50'
              }`}
              style={{ borderTopColor: isDeptActive ? dept.color : '#94A3B8' }}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shadow-2xs flex-shrink-0"
                      style={{
                        backgroundColor: `${dept.color}15`,
                        borderColor: `${dept.color}35`,
                        color: dept.color,
                      }}
                    >
                      {dept.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-[17px] tracking-tight">
                        {dept.name}
                      </h3>
                      <div className="mt-1">
                        <Badge status={dept.status} dot size="md" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(dept)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleDepartmentStatus(dept.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDeptActive
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={isDeptActive ? 'Deactivate department' : 'Activate department'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-500 mt-3 line-clamp-2 leading-relaxed font-medium">
                  {dept.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Staff</span>
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 mt-0.5 block">
                      {deptEmployees.length}
                    </span>
                  </div>

                  <div className="border-l border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Projects</span>
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 mt-0.5 block">
                      {deptProjects.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Department Details Button */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-between text-sm font-bold shadow-2xs"
                  onClick={() => navigate(`/admin/department/${dept.id}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Open Workspace
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Department"
        subtitle="Introduce an operational unit"
        maxWidth="sm"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quality Assurance"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities and team scope..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <span className="font-mono text-sm font-semibold text-slate-600">{color}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        title="Edit Department"
        subtitle={`Updating information for ${editingDept?.name}`}
        maxWidth="sm"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setEditingDept(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
