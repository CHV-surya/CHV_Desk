import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, FolderKanban, User, FileSpreadsheet, Users } from 'lucide-react';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { EditProjectModal } from './EditProjectModal';
import { AssignEditorsModal } from '../digital-marketing/AssignEditorsModal';
import { useData } from '../../context/DataContext';

interface ProjectTableProps {
  projects: Project[];
  isAdmin: boolean;
  currentUserId?: string;
  onRenameProject: (id: string, newName: string, description?: string) => void | Promise<void>;
  onDeleteProject?: (id: string) => void | Promise<void>;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  isAdmin,
  currentUserId,
  onRenameProject,
  onDeleteProject,
}) => {
  const navigate = useNavigate();
  const { refreshData } = useData();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Project | null>(null);
  const [assignModalProject, setAssignModalProject] = useState<Project | null>(null);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold">Project Name</th>
              <th className="py-3.5 px-3.5 font-bold">Department</th>
              <th className="py-3.5 px-3.5 font-bold">Created By</th>
              <th className="py-3.5 px-3.5 font-bold">Registered</th>
              <th className="py-3.5 px-3.5 font-bold">Status</th>
              <th className="py-3.5 px-5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                      <FolderKanban className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700 text-base">No Projects Found</p>
                    <p className="text-xs sm:text-[13px] text-slate-400 mt-1 max-w-sm font-medium">
                      {isAdmin
                        ? 'No projects registered across departments. Click "New Project" to register an asset.'
                        : 'You have not created any projects yet. Click "Create Project" to register a deliverable.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const isOwner = proj.createdBy === currentUserId;
                const isAssigned = Boolean(proj.isAssigned);
                const canRename = (isAdmin || isOwner) && !isAssigned;
                const canDelete = isAdmin && !isAssigned;
                const canAssignEditors = (isAdmin || isOwner) && !isAssigned;
                const isDmProject =
                  proj.departmentName?.toLowerCase().includes('digital') ||
                  proj.departmentName === 'Digital Marketing';

                return (
                  <tr key={proj.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Project Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80 flex-shrink-0 shadow-2xs">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm sm:text-[15px] truncate">{proj.name}</div>
                          {proj.description && (
                            <div className="text-xs text-slate-400 max-w-sm truncate mt-0.5 font-medium">
                              {proj.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {proj.departmentName}
                      </span>
                    </td>

                    {/* Created By */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{proj.createdByName}</span>
                        {isOwner && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                            You
                          </span>
                        )}
                        {isAssigned && (
                          <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold">
                            Assigned (Read-Only)
                          </span>
                        )}
                        {proj.assignedEditors && proj.assignedEditors.length > 0 && !isAssigned && (
                          <span
                            className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1"
                            title={`Assigned Editors: ${proj.assignedEditors.map((e) => e.fullName).join(', ')}`}
                          >
                            <Users className="w-3 h-3 text-purple-600" />
                            {proj.assignedEditors.length} Editor{proj.assignedEditors.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-500 font-medium">
                      {proj.createdAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3.5">
                      <Badge
                        variant={proj.status === 'completed' ? 'success' : 'blue'}
                        dot
                        size="md"
                      >
                        {proj.status === 'completed' ? 'Completed' : 'Active'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDmProject && (
                          <button
                            type="button"
                            onClick={() => {
                              const path = isAdmin
                                ? `/admin/digital-marketing/${proj.id}`
                                : `/employee/digital-marketing/${proj.id}`;
                              navigate(path);
                            }}
                            title="Open Monthly Reporting Workspace"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs cursor-pointer mr-1"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Monthly Reports</span>
                          </button>
                        )}

                        {isDmProject && canAssignEditors && (
                          <button
                            type="button"
                            onClick={() => setAssignModalProject(proj)}
                            title="Assign Video Editors"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors cursor-pointer"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}

                        {canRename && (
                          <button
                            onClick={() => setEditingProject(proj)}
                            title="Rename Project"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && onDeleteProject && (
                          <button
                            onClick={() => setDeleteCandidate(proj)}
                            title="Delete Project Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditProjectModal
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onRename={onRenameProject}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate && onDeleteProject) {
            onDeleteProject(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Project Asset"
        message={`Are you sure you want to remove "${deleteCandidate?.name}"? While permanent by default, administrator deletion removes this record from reports.`}
        confirmText="Yes, Delete Project"
        variant="danger"
      />

      {/* Assign Video Editors Modal */}
      {assignModalProject && (
        <AssignEditorsModal
          isOpen={!!assignModalProject}
          onClose={() => setAssignModalProject(null)}
          projectId={assignModalProject.id}
          projectName={assignModalProject.name}
          onSaved={async () => {
            await refreshData();
          }}
        />
      )}
    </div>
  );
};
