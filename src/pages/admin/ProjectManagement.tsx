import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { SearchInput } from '../../components/common/SearchInput';
import { Button } from '../../components/common/Button';

export const ProjectManagement: React.FC = () => {
  const { projects, departments, addProject, renameProject, deleteProject } = useData();
  const { currentUser, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.createdByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              Organization Projects
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              {projects.length} Permanent Records
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Client deliverables and internal operational project records across all business units
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

      {/* Retention Policy Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 leading-relaxed font-medium">
          <strong>Permanent Data Integrity Rule:</strong> Projects are permanent organizational assets and are <strong>never</strong> purged by monthly activity cleanups. Only System Administrators possess permissions to delete project records.
        </p>
      </div>

      {/* Filters and Search */}
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
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Departments ({projects.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({projects.filter((p) => p.departmentId === d.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectTable
        projects={filteredProjects}
        isAdmin={isAdmin}
        currentUserId={currentUser?.id}
        onRenameProject={renameProject}
        onDeleteProject={deleteProject}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        departments={departments}
        onAdd={(data) => {
          addProject({
            name: data.name,
            departmentId: data.departmentId,
            description: data.description,
            createdBy: currentUser?.id || 'emp-admin',
            createdByName: currentUser?.fullName || 'Admin',
          });
        }}
      />
    </div>
  );
};
