import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Plus,
  LogIn,
  LogOut,
  Building2,
  Code2,
  Film,
  TrendingUp,
  GitBranch,
  Video,
  Target,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const DepartmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, activeDepartmentId, setActiveDepartmentId } = useAuth();
  const {
    departments,
    projects,
    activities,
    getEmployeeTodayActivity,
    joinToday,
    endToday,
  } = useData();

  // Find active department object
  const activeDept = departments.find((d) => d.id === activeDepartmentId) || departments[0];

  // Employee's assigned departments
  const assignedDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );

  // Projects created by this user in this department (strictly scoped to current employee)
  const myProjects = projects.filter(
    (p) => p.departmentId === activeDept?.id && (!currentUser || p.createdBy === currentUser.id)
  );

  // Today's activity for this employee in this department
  const todayActivity = currentUser
    ? getEmployeeTodayActivity(currentUser.id, activeDept?.id)
    : undefined;

  const todayStatus = todayActivity?.status || 'not-joined';

  // Distinctive Department Configuration & Meta
  const getDepartmentIdentity = (slug?: string) => {
    switch (slug) {
      case 'software':
        return {
          title: 'Software Engineering & Technical Workspace',
          badge: 'Dev & Architecture',
          icon: <Code2 className="w-6 h-6 text-blue-600" />,
          accentColor: '#2563EB',
          metric1Label: 'Active Codebases',
          metric2Label: 'My Modules',
          metric3Label: 'Dev Session',
          metric4Label: 'Hours Coded',
          bannerTag: 'DEVELOPMENT SPRINT',
          bannerHeadline: 'Sprint deliverables, PR reviews, and frontend/backend features',
          itemLabel: 'Repositories & Projects',
        };
      case 'video-editor':
        return {
          title: 'Creative Studio & Video Production Workspace',
          badge: 'Production & Motion',
          icon: <Film className="w-6 h-6 text-purple-600" />,
          accentColor: '#8B5CF6',
          metric1Label: 'Production Assets',
          metric2Label: 'My Projects',
          metric3Label: 'Studio Session',
          metric4Label: 'Editing Hours',
          bannerTag: 'MEDIA PRODUCTION',
          bannerHeadline: '4K video mastering, motion graphics, and social campaign cuts',
          itemLabel: 'Editing Timelines',
        };
      case 'digital-marketing':
        return {
          title: 'Growth, SEO & Campaign Operations Workspace',
          badge: 'Demand Gen & SEO',
          icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
          accentColor: '#10B981',
          metric1Label: 'Active Campaigns',
          metric2Label: 'My Funnels',
          metric3Label: 'Campaign Session',
          metric4Label: 'Growth Hours',
          bannerTag: 'GROWTH OPERATIONS',
          bannerHeadline: 'SEO audits, ad spend management, and inbound lead pipelines',
          itemLabel: 'Marketing Campaigns',
        };
      default:
        return {
          title: `${activeDept?.name || 'Department'} Operations Workspace`,
          badge: 'Operational Unit',
          icon: <Building2 className="w-6 h-6 text-slate-600" />,
          accentColor: '#64748B',
          metric1Label: 'Department Projects',
          metric2Label: 'My Projects',
          metric3Label: 'Session Status',
          metric4Label: 'Hours Logged',
          bannerTag: 'OPERATIONS',
          bannerHeadline: 'Daily work deliverables, client tasks, and time tracking',
          itemLabel: 'Projects & Tasks',
        };
    }
  };

  const identity = getDepartmentIdentity(activeDept?.slug);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cross-department switcher strip for multi-dept employees */}
      {assignedDepts.length > 1 && (
        <div
          className="p-4 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-mono text-slate-300 font-semibold">
              Assigned to {assignedDepts.length} departments. Active view:
            </span>
          </div>
          <div className="flex items-center gap-2">
            {assignedDepts.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDepartmentId(d.id)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  d.id === activeDept?.id
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Department Header */}
      <div
        className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 border-t-4"
        style={{ borderTopColor: identity.accentColor }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-base border flex-shrink-0 mt-0.5 shadow-2xs"
            style={{
              backgroundColor: `${activeDept?.color || '#3B82F6'}15`,
              borderColor: `${activeDept?.color || '#3B82F6'}30`,
            }}
          >
            {identity.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {identity.title}
              </h1>
              <Badge status={todayStatus} dot size="md" />
              <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-md font-bold">
                {identity.badge}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed font-medium">
              {activeDept?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {activeDept?.slug === 'digital-marketing' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/employee/digital-marketing')}
              icon={<FileSpreadsheet className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Monthly Reports
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/employee/records')}
            icon={<Calendar className="w-4 h-4" />}
          >
            My Records
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/employee/activity')}
            icon={<Clock className="w-4 h-4" />}
          >
            Activity Tracker
          </Button>
        </div>
      </div>

      {/* Distinctive Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {identity.metric2Label}
          </span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{myProjects.length}</span>
            <span className="text-xs font-mono text-slate-400 font-semibold">Created by you</span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100/80 truncate font-medium">
            {activeDept?.name} domain
          </p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Active Projects
          </span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono" style={{ color: identity.accentColor }}>
              {myProjects.filter((p) => p.status === 'active').length}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">In progress</span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100/80 truncate font-medium">
            Permanent records
          </p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {identity.metric3Label}
          </span>
          <div className="mt-2.5 flex items-center justify-between">
            <Badge status={todayStatus} dot size="md" />
            <span className="text-xs font-mono text-slate-400 font-bold">
              {todayActivity?.joinTime || 'Pending'}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100/80 truncate font-medium">
            {todayActivity?.joinTime ? `Clocked in: ${todayActivity.joinTime}` : 'Not joined yet today'}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {identity.metric4Label}
          </span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-600">
              {todayActivity?.workingHours || (todayActivity?.joinTime ? 'Active...' : '0h 0m')}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">Today</span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100/80 truncate font-medium">
            {todayActivity?.endTime ? `Ended: ${todayActivity.endTime}` : 'Live session in progress'}
          </p>
        </div>
      </div>

      {/* Quick Session Controller */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
              style={{ backgroundColor: `${identity.accentColor}15`, border: `1px solid ${identity.accentColor}30` }}
            >
              <Clock className="w-5 h-5" style={{ color: identity.accentColor }} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {identity.bannerTag} • Time & Session Controls
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-12 font-medium">
            {todayActivity?.joinTime
              ? `Shift active since ${todayActivity.joinTime}. Click END to record your latest progress.`
              : `Click JOIN to record your official work session start time for ${activeDept?.name}.`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!todayActivity?.joinTime ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (currentUser && activeDept) {
                  joinToday(currentUser.id, activeDept.id);
                }
              }}
              icon={<LogIn className="w-4 h-4" />}
            >
              JOIN Shift
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (currentUser && activeDept) {
                  endToday(currentUser.id, activeDept.id);
                }
              }}
              icon={<LogOut className="w-4 h-4" />}
            >
              {todayActivity.endTime ? 'Update END Time' : 'END Work Session'}
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/employee/activity')}
          >
            Open Notes & Log
          </Button>
        </div>
      </div>

      {/* Department Projects Section */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/60">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
              {identity.itemLabel} ({myProjects.length})
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-medium">
              Permanent project records created by you in {activeDept?.name}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/employee/projects')}
            className="text-sm text-blue-600 hover:text-blue-700 font-bold"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            View Projects
          </Button>
        </div>

        <div className="divide-y divide-slate-100/80">
          {myProjects.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              <FolderKanban className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              You haven't created any projects in this department yet.
            </div>
          ) : (
            myProjects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="p-4 px-6 flex items-center justify-between hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-[15px]">{project.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">
                      {project.description || 'Active work asset'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline font-medium">
                    Created: {project.createdAt}
                  </span>
                  <Badge variant={project.status === 'completed' ? 'success' : 'blue'} dot size="md">
                    {project.status === 'completed' ? 'Completed' : 'Active'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
