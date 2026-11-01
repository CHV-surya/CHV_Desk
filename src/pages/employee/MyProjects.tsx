import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { SearchInput } from '../../components/common/SearchInput';
import { Button } from '../../components/common/Button';

export const MyProjects: React.FC = () => {
  const { currentUser, activeDepartmentId, isAdmin } = useAuth();
  const { projects, departments, addProject, renameProject } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeDept = departments.find((d) => d.id === activeDepartmentId);

  const departmentProjects = projects.filter(
    (p) =>
      (p.departmentId === activeDepartmentId && (!currentUser || p.createdBy === currentUser.id)) ||
      Boolean(p.isAssigned)
  );

  const filteredProjects = departmentProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const userDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My {activeDept?.name} Projects
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              {departmentProjects.length} Records
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Permanent project records created by you within your active department
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

      {/* Permanent Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 leading-relaxed font-medium">
          <strong>Permanent Data Integrity:</strong> Projects registered here are permanently preserved and exempt from monthly cleanups. You can rename your own projects anytime. Project deletions require administrative authorization.
        </p>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="max-w-md w-full">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Filter ${activeDept?.name} projects...`}
          />
        </div>
        <span className="text-xs sm:text-[13px] font-mono text-slate-500 font-semibold hidden sm:block">
          Showing {filteredProjects.length} projects
        </span>
      </div>

      {/* Projects Table */}
      <ProjectTable
        projects={filteredProjects}
        isAdmin={isAdmin}
        currentUserId={currentUser?.id}
        onRenameProject={renameProject}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        departments={userDepts.length > 0 ? userDepts : departments}
        defaultDepartmentId={activeDepartmentId || undefined}
        onAdd={(data) => {
          if (currentUser) {
            addProject({
              name: data.name,
              departmentId: data.departmentId,
              description: data.description,
              createdBy: currentUser.id,
              createdByName: currentUser.fullName,
            });
          }
        }}
      />
    </div>
  );
};
