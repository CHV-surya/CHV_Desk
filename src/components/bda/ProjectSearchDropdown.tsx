import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X, Plus, FolderKanban } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface ProjectSearchDropdownProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ProjectSearchDropdown: React.FC<ProjectSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select an associated project...',
  className = '',
  disabled = false,
}) => {
  const { projects, departments, addProject, refreshData } = useData();
  const { isAdmin, isManager, currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDeptId, setNewProjectDeptId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setCreateError('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const selectedProject = projects.find((p) => p.id === value);
  const selectedDept = selectedProject
    ? departments.find((d) => d.id === selectedProject.departmentId)
    : null;

  const filteredProjects = activeProjects.filter((p) => {
    const term = search.toLowerCase();
    const dept = departments.find((d) => d.id === p.departmentId);
    return (
      p.name.toLowerCase().includes(term) ||
      (dept && dept.name.toLowerCase().includes(term))
    );
  });

  const canCreateProject = isAdmin || isManager;

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }
    const targetDeptId = newProjectDeptId || departments[0]?.id;
    if (!targetDeptId) {
      setCreateError('Please select a department');
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError('');
      await addProject({
        name: newProjectName.trim(),
        departmentId: targetDeptId,
        createdBy: currentUser?.id,
        createdByName: currentUser?.fullName || currentUser?.username || 'User',
      });
      await refreshData();
      setIsCreating(false);
      setNewProjectName('');
      setIsOpen(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150 ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 cursor-pointer'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedProject ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {selectedProject.name}
              </span>
              {selectedDept && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  {selectedDept.name}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {!isCreating ? (
            <>
              {/* Search Bar */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects or departments..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto p-1 text-sm">
                {/* Unassigned / None option */}
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    value === null
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="italic text-slate-500 dark:text-slate-400">
                    -- No Project Linked --
                  </span>
                  {value === null && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                {filteredProjects.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active projects found matching &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filteredProjects.map((proj) => {
                    const dept = departments.find((d) => d.id === proj.departmentId);
                    const isSelected = proj.id === value;

                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          onChange(proj.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{proj.name}</span>
                          {dept && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {dept.name}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Inline Create Project Option */}
              {canCreateProject && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(true);
                      setNewProjectDeptId(departments[0]?.id || '');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Project
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Inline Create Project Form */
            <form onSubmit={handleCreateNewProject} className="p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  New Project
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Acme Mobile App"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department *
                </label>
                <select
                  value={newProjectDeptId}
                  onChange={(e) => setNewProjectDeptId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save & Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
