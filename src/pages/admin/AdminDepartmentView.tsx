import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Activity,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { ActivityTable } from '../../components/activity/ActivityTable';
import { getFormattedDate } from '../../data/mockData';

export const AdminDepartmentView: React.FC = () => {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { departments, employees, projects, activities, addProject, renameProject, deleteProject } = useData();

  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'activities'>('projects');
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  const department = departments.find((d) => d.id === deptId);

  if (!department) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Department Not Found</h2>
        <p className="text-sm text-slate-500 font-medium">The requested department could not be located.</p>
        <Button variant="primary" size="md" onClick={() => navigate('/admin')}>
          Return to Admin Dashboard
        </Button>
      </div>
    );
  }

  const deptEmployees = employees.filter((e) =>
    e.assignedDepartments.includes(department.id)
  );

  const deptProjects = projects.filter((p) => p.departmentId === department.id);

  const deptActivities = activities.filter((a) => a.departmentId === department.id);

  const today = getFormattedDate();
  const currentlyWorkingCount = deptActivities.filter(
    (a) => a.date === today && a.status === 'working'
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button & Department Header */}
      <div>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </button>

        <div
          className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 border-t-4"
          style={{ borderTopColor: department.color }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg border shadow-2xs flex-shrink-0"
              style={{
                backgroundColor: `${department.color}15`,
                borderColor: `${department.color}35`,
                color: department.color,
              }}
            >
              {department.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {department.name} Department
                </h1>
                <Badge status={department.status} dot size="md" />
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-xl font-medium leading-relaxed">
                {department.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddProjectModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Project
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200/60 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 block leading-tight">{deptEmployees.length}</span>
            <span className="text-xs sm:text-[13px] text-slate-400 font-semibold uppercase tracking-wider">Assigned Members</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200/60 shadow-2xs">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 block leading-tight">{deptProjects.length}</span>
            <span className="text-xs sm:text-[13px] text-slate-400 font-semibold uppercase tracking-wider">Department Projects</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200/60 shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 block leading-tight">{currentlyWorkingCount}</span>
            <span className="text-xs sm:text-[13px] text-slate-400 font-semibold uppercase tracking-wider">Active Now Today</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-3 font-bold border-b-2 transition-all ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Projects ({deptProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 font-bold border-b-2 transition-all ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Team Members ({deptEmployees.length})
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-3 font-bold border-b-2 transition-all ${
            activeTab === 'activities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Activities ({deptActivities.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'projects' && (
        <ProjectTable
          projects={deptProjects}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
        />
      )}

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptEmployees.map((emp) => (
            <div
              key={emp.id}
              className="glass-card glass-card-hover rounded-2xl p-4.5 flex items-center gap-3.5"
            >
              <Avatar
                name={emp.fullName}
                size="lg"
                className="w-10 h-10 border border-slate-200 shadow-2xs"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm sm:text-[15px] truncate">{emp.fullName}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{emp.username}</p>
                <div className="mt-1.5">
                  <Badge status={emp.status} dot size="md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'activities' && (
        <ActivityTable activities={deptActivities} showEmployeeName={true} />
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        departments={departments}
        defaultDepartmentId={department.id}
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
