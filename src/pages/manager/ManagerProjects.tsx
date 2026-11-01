import React, { useState } from 'react';
import { Plus, ShieldCheck, FolderKanban } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { SearchInput } from '../../components/common/SearchInput';
import { Button } from '../../components/common/Button';

export const ManagerProjects: React.FC = () => {
  const { projects, departments, addProject, renameProject } = useData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Departments assigned to this manager
  const managerDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );
  const managerDeptIds = new Set(managerDepts.map((d) => d.id));

  // Projects strictly belonging to manager's assigned departments
  const scopedProjects = projects.filter((proj) => managerDeptIds.has(proj.departmentId));

  const filteredProjects = scopedProjects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.createdByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept =
      departmentFilter === 'all' || proj.departmentId === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Department Projects & Assignments
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              {scopedProjects.length} Projects
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Supervise project deliverables and assign team members within your managed business units
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Project
        </Button>
      </div>

      {/* Security & Access Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-950 leading-relaxed font-medium">
          <strong>Manager Authorization Scope:</strong> You can create projects in your assigned departments and assign team members to deliverables. Projects created by you can be renamed anytime. Project deletion is restricted to System Administrators.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects or creator name..."
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Managed Departments ({scopedProjects.length})</option>
            {managerDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({scopedProjects.filter((p) => p.departmentId === d.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectTable
        projects={filteredProjects}
        isAdmin={false}
        isManager={true}
        currentUserId={currentUser?.id}
        onRenameProject={renameProject}
      />

      {/* Create Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        departments={managerDepts}
        onAdd={addProject}
      />
    </div>
  );
};
