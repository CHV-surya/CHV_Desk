import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  FileSpreadsheet,
  Download,
  Plus,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api, ApiError } from '../../lib/api';
import {
  Project,
  DigitalMarketingWorkspaceData,
  DigitalMarketingEntry,
  DmContentType,
} from '../../types';
import { MonthYearSelector, MONTH_NAMES } from '../../components/digital-marketing/MonthYearSelector';
import { TargetCards } from '../../components/digital-marketing/TargetCards';
import { ContentSectionTable } from '../../components/digital-marketing/ContentSectionTable';
import { AddEntryModal } from '../../components/digital-marketing/AddEntryModal';
import { EditEntryModal } from '../../components/digital-marketing/EditEntryModal';
import { EditTargetsModal } from '../../components/digital-marketing/EditTargetsModal';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { Button } from '../../components/common/Button';

export const DigitalMarketingWorkspacePage: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();
  const { departments, addProject } = useData();

  // Selected date state (defaults to current date in IST)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);

  // DM Projects list
  const [dmProjects, setDmProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    routeProjectId || null
  );

  // Workspace Data
  const [workspaceData, setWorkspaceData] =
    useState<DigitalMarketingWorkspaceData | null>(null);

  // Loading & notification states
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modals state
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [activeEntryType, setActiveEntryType] = useState<DmContentType>('video');
  const [editingEntry, setEditingEntry] = useState<DigitalMarketingEntry | null>(null);
  const [isEditTargetsModalOpen, setIsEditTargetsModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Notification helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // 1. Fetch authorized DM projects
  const fetchDmProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      const projects = await api.get<Project[]>('/digital-marketing/projects');
      setDmProjects(projects || []);

      // If routeProjectId exists and is valid, use it; otherwise select first project
      if (routeProjectId && projects.some((p) => p.id === routeProjectId)) {
        setSelectedProjectId(routeProjectId);
      } else if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load Digital Marketing projects:', err);
      showToast('error', err.message || 'Failed to load Digital Marketing projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [routeProjectId]);

  useEffect(() => {
    fetchDmProjects();
  }, [fetchDmProjects]);

  // Update selectedProjectId if URL changes
  useEffect(() => {
    if (routeProjectId && routeProjectId !== selectedProjectId) {
      setSelectedProjectId(routeProjectId);
    }
  }, [routeProjectId]);

  // 2. Fetch monthly workspace data for selected project, year, and month
  const fetchWorkspaceData = useCallback(async () => {
    if (!selectedProjectId) {
      setWorkspaceData(null);
      return;
    }

    try {
      setIsLoadingWorkspace(true);
      const data = await api.get<DigitalMarketingWorkspaceData>(
        `/digital-marketing/projects/${selectedProjectId}/months/${selectedYear}/${selectedMonth}`
      );
      setWorkspaceData(data);
    } catch (err: any) {
      console.error('Failed to load monthly workspace data:', err);
      showToast('error', err.message || 'Failed to load monthly records');
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [selectedProjectId, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // 3. Handle project switch
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const basePath = isAdmin ? '/admin/digital-marketing' : '/employee/digital-marketing';
    navigate(`${basePath}/${projectId}`);
  };

  // 4. Handle month/year change
  const handleMonthYearChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // 5. Update Monthly Targets
  const handleSaveTargets = async (targets: {
    videoTarget: number;
    posterTarget: number;
  }) => {
    if (!workspaceData?.monthRecord?.id) return;
    try {
      await api.patch(
        `/digital-marketing/months/${workspaceData.monthRecord.id}/targets`,
        targets
      );
      showToast('success', 'Monthly targets updated successfully');
      await fetchWorkspaceData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update targets');
      throw err;
    }
  };

  // 6. Add Entry
  const handleAddEntry = async (data: {
    contentType: DmContentType;
    contentName: string;
    videoShoot?: boolean | null;
    editing?: boolean | null;
    clientConfirmation?: boolean | null;
    scheduled?: boolean | null;
    scheduledDate?: string | null;
    adCampaignReportUrl?: string | null;
  }) => {
    if (!workspaceData?.monthRecord?.id) return;
    try {
      await api.post(
        `/digital-marketing/months/${workspaceData.monthRecord.id}/entries`,
        data
      );
      showToast(
        'success',
        `${data.contentType === 'video' ? 'Video' : 'Poster'} added successfully`
      );
      await fetchWorkspaceData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add entry');
      throw err;
    }
  };

  // 7. Update Entry
  const handleUpdateEntry = async (
    entryId: string,
    data: {
      contentName?: string;
      videoShoot?: boolean | null;
      editing?: boolean | null;
      clientConfirmation?: boolean | null;
      scheduled?: boolean | null;
      scheduledDate?: string | null;
      adCampaignReportUrl?: string | null;
    }
  ) => {
    try {
      await api.patch(`/digital-marketing/entries/${entryId}`, data);
      showToast('success', 'Entry updated successfully');
      await fetchWorkspaceData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update entry');
      throw err;
    }
  };

  // 8. Quick Update Status (Inline dropdown change)
  const handleQuickUpdateStatus = async (
    entryId: string,
    field: 'videoShoot' | 'editing' | 'clientConfirmation' | 'scheduled',
    value: boolean | null
  ) => {
    try {
      // Optimistic local state update
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const updatedEntries = prev.entries.map((e) =>
          e.id === entryId ? { ...e, [field]: value } : e
        );
        return { ...prev, entries: updatedEntries };
      });

      await api.patch(`/digital-marketing/entries/${entryId}`, { [field]: value });
      // Re-fetch to synchronize stats (progress & scheduled count)
      await fetchWorkspaceData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update workflow status');
      await fetchWorkspaceData(); // Rollback on error
    }
  };

  // 9. Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await api.delete(`/digital-marketing/entries/${entryId}`);
      showToast('success', 'Entry deleted successfully');
      await fetchWorkspaceData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete entry');
    }
  };

  // 10. Export to Excel
  const handleExportExcel = async () => {
    if (!workspaceData?.monthRecord?.id) return;
    try {
      setIsExporting(true);
      const monthName = MONTH_NAMES[selectedMonth - 1] || `Month_${selectedMonth}`;
      const projectName = workspaceData.project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fallbackName = `${projectName}_${monthName}_${selectedYear}_Report.xlsx`;

      await api.downloadBlob(
        `/digital-marketing/months/${workspaceData.monthRecord.id}/export`,
        fallbackName
      );
      showToast('success', 'Excel report downloaded successfully');
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast('error', err.message || 'Failed to export Excel report');
    } finally {
      setIsExporting(false);
    }
  };

  // 11. Create new DM Project
  const dmDepartment = departments.find((d) => d.slug === 'digital-marketing');

  const videoEntries =
    workspaceData?.entries?.filter((e) => e.contentType === 'video') || [];
  const posterEntries =
    workspaceData?.entries?.filter((e) => e.contentType === 'poster') || [];

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-100 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-md"
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 45%, #059669 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-emerald-200 text-xs font-mono font-bold tracking-wider uppercase">
                Digital Marketing Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Monthly Project Campaign Management
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base font-medium mt-1 max-w-2xl leading-relaxed">
              Track video and poster production workflows, set monthly targets, and generate
              client-ready Excel spreadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Create Project Button */}
            <button
              type="button"
              onClick={() => setIsAddProjectModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New DM Project
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || !workspaceData?.monthRecord?.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              )}
              <span>{isExporting ? 'Generating Excel...' : 'EXPORT EXCEL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Project Selector Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/80 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Project
            </span>
            {isLoadingProjects ? (
              <span className="text-sm font-bold text-slate-500">Loading projects...</span>
            ) : dmProjects.length === 0 ? (
              <span className="text-sm font-bold text-slate-600">
                No Digital Marketing projects yet
              </span>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-extrabold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                >
                  {dmProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 hidden sm:inline-block">
                  {dmProjects.length} Projects Available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Month & Year Selector */}
        <MonthYearSelector
          currentYear={selectedYear}
          currentMonth={selectedMonth}
          onChange={handleMonthYearChange}
          isLoading={isLoadingWorkspace}
        />
      </div>

      {/* If No Projects Exist */}
      {dmProjects.length === 0 && !isLoadingProjects ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-200/80 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            No Digital Marketing Projects Found
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 font-medium">
            {isAdmin
              ? 'There are currently no projects in the Digital Marketing department. Create one to begin monthly reporting.'
              : 'You do not have any projects in the Digital Marketing department yet. Click "Create Project" to set up your first campaign asset.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddProjectModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Digital Marketing Project
          </button>
        </div>
      ) : isLoadingWorkspace ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-slate-200/80 bg-white flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold text-slate-600">
            Loading monthly reporting workspace...
          </p>
        </div>
      ) : workspaceData ? (
        <>
          {/* 3. Monthly Targets Summary Cards */}
          <TargetCards
            stats={workspaceData.stats}
            onEditTargets={() => setIsEditTargetsModalOpen(true)}
            isLoading={isLoadingWorkspace}
          />

          {/* 4. SECTION 1: VIDEOS */}
          <ContentSectionTable
            title="VIDEOS"
            contentType="video"
            entries={videoEntries}
            target={workspaceData.stats.videoTarget}
            onAddEntry={() => {
              setActiveEntryType('video');
              setIsAddEntryModalOpen(true);
            }}
            onEditEntry={(entry) => setEditingEntry(entry)}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onDeleteEntry={handleDeleteEntry}
            isLoading={isLoadingWorkspace}
          />

          {/* 5. SECTION 2: POSTERS */}
          <ContentSectionTable
            title="POSTERS"
            contentType="poster"
            entries={posterEntries}
            target={workspaceData.stats.posterTarget}
            onAddEntry={() => {
              setActiveEntryType('poster');
              setIsAddEntryModalOpen(true);
            }}
            onEditEntry={(entry) => setEditingEntry(entry)}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onDeleteEntry={handleDeleteEntry}
            isLoading={isLoadingWorkspace}
          />
        </>
      ) : null}

      {/* Add Entry Modal */}
      <AddEntryModal
        isOpen={isAddEntryModalOpen}
        onClose={() => setIsAddEntryModalOpen(false)}
        contentType={activeEntryType}
        onAdd={handleAddEntry}
      />

      {/* Edit Entry Modal */}
      <EditEntryModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
        onUpdate={handleUpdateEntry}
      />

      {/* Edit Targets Modal */}
      {workspaceData && (
        <EditTargetsModal
          isOpen={isEditTargetsModalOpen}
          onClose={() => setIsEditTargetsModalOpen(false)}
          videoTarget={workspaceData.stats.videoTarget}
          posterTarget={workspaceData.stats.posterTarget}
          monthName={workspaceData.monthRecord.monthName}
          year={workspaceData.monthRecord.year}
          onSave={handleSaveTargets}
        />
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        departments={
          dmDepartment
            ? [dmDepartment]
            : departments.filter((d) => d.slug === 'digital-marketing')
        }
        defaultDepartmentId={dmDepartment?.id}
        onAdd={async (data) => {
          if (currentUser) {
            await addProject({
              name: data.name,
              departmentId: data.departmentId,
              description: data.description,
              createdBy: currentUser.id,
              createdByName: currentUser.fullName,
            });
            showToast('success', `Created project "${data.name}"`);
            await fetchDmProjects();
          }
        }}
      />
    </div>
  );
};
