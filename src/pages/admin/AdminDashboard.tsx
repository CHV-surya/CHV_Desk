import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  FolderKanban,
  Building2,
  Calendar,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Eye,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getFormattedDate } from '../../data/mockData';
import { DepartmentCard } from '../../components/dashboard/DepartmentCard';
import { RecentActivityTable } from '../../components/dashboard/RecentActivityTable';
import { ActivityChart } from '../../components/dashboard/ActivityChart';
import { Button } from '../../components/common/Button';
import { AddEmployeeModal } from '../../components/employees/AddEmployeeModal';
import { AddProjectModal } from '../../components/projects/AddProjectModal';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { departments, employees, projects, activities, addEmployee, addProject } = useData();

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  const today = getFormattedDate();

  // Metrics calculation
  const staffEmployees = employees.filter((e) => e.role !== 'admin');
  const totalEmployees = staffEmployees.length;
  const todayActivities = activities.filter((a) => a.date === today);

  const currentlyWorking = todayActivities.filter((a) => a.status === 'working').length;
  const completedToday = todayActivities.filter((a) => a.status === 'completed').length;
  const activeToday = currentlyWorking + completedToday;
  const notJoinedToday = Math.max(0, totalEmployees - activeToday);
  const totalProjects = projects.length;
  const totalDepartments = departments.length;

  const attendanceRate = totalEmployees > 0 ? Math.round((activeToday / totalEmployees) * 100) : 0;

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Department latest activity helper
  const getDeptLatestActivityNote = (deptId: string): string | undefined => {
    const act = activities.find((a) => a.departmentId === deptId && a.notes);
    return act?.notes;
  };

  const getDeptProjects = (deptId: string): string[] => {
    return projects.filter((p) => p.departmentId === deptId).map((p) => p.name);
  };

  // Donut chart data for attendance
  const donutData = [
    { name: 'Working', value: currentlyWorking, color: '#2563EB' },
    { name: 'Completed', value: completedToday, color: '#10B981' },
    { name: 'Not Joined', value: notJoinedToday, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  // Fallback if no data
  if (donutData.length === 0) {
    donutData.push({ name: 'No Data', value: 1, color: '#E2E8F0' });
  }

  const currentDateDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* 1. Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-8 shadow-md"
        style={{
          background: 'linear-gradient(135deg, #172554 0%, #1e3a7a 50%, #2563EB 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M48.2,-55.7C59.2,-42.5,63.1,-24.8,64.5,-7.4C66,10.1,65,27.3,55.5,38.3C46,49.4,28.1,54.2,10.8,57.5C-6.5,60.7,-23.2,62.4,-36.4,55.5C-49.6,48.6,-59.3,33,-62.4,16.3C-65.5,-0.4,-62,-18.2,-52.5,-31.3C-43,-44.5,-27.5,-53,-12,-52.5C3.5,-52,37.2,-68.9,48.2,-55.7Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-1/3 w-56 h-56 opacity-5 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M36.6,-46.9C48.3,-37.1,59.2,-26.4,63.5,-13C67.9,0.5,65.8,16.7,57.6,28.6C49.4,40.5,35.2,48.2,20.5,53.1C5.9,58,-9.3,60.1,-22.8,55.8C-36.3,51.4,-48.1,40.6,-55.3,27.3C-62.6,13.9,-65.3,-2,-60.3,-15.1C-55.3,-28.3,-42.6,-38.8,-30.1,-48.4C-17.5,-58,-4.1,-66.7,6.1,-74.1C16.3,-81.5,24.9,-56.7,36.6,-46.9Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          {/* Left Section (65%) */}
          <div className="w-full lg:w-[63%] xl:w-[65%] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-mono font-bold tracking-wider uppercase">
                WorkTrack Operations Control
              </span>
            </div>
            <h1 className="text-3xl sm:text-[34px] font-extrabold text-white tracking-tight leading-tight">
              {getGreeting()}, {currentUser?.fullName?.split(' ')[0] || 'Chandu'}!
            </h1>
            <p className="text-blue-100 text-[15px] sm:text-base font-medium mt-2 max-w-2xl leading-relaxed">
              Here's what's happening across your organization today. Monitor workforce activity, track project progress, and manage department operations.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-3.5 pt-3 border-t border-white/15 text-blue-100 text-sm font-medium">
              <span className="flex items-center gap-2 text-white font-semibold">
                <Calendar className="w-4 h-4 text-blue-300" />
                {currentDateDisplay}
              </span>
              <span className="text-blue-300/60">•</span>
              <span className="text-blue-200 font-medium">
                {totalDepartments} Departments
              </span>
              <span className="text-blue-300/60">•</span>
              <span className="text-blue-200 font-medium">
                {totalEmployees} Team Members
              </span>
            </div>
          </div>

          {/* Right Section (35%): 2x2 Quick Action Grid */}
          <div className="w-full lg:w-[37%] xl:w-[35%] lg:min-w-[320px] flex-shrink-0">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-200/90 mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-300" />
              <span>Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* 1. Add Employee */}
              <button
                type="button"
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="group relative flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.22] active:bg-white/[0.28] border border-white/20 hover:border-white/45 backdrop-blur-md shadow-xs hover:shadow-lg hover:shadow-blue-950/25 transition-all duration-200 hover:-translate-y-0.5 text-left text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs">
                  <UserPlus className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-white tracking-tight leading-snug truncate">
                    Add Employee
                  </span>
                  <span className="block text-xs text-blue-100/75 font-medium truncate mt-0.5">
                    New profile
                  </span>
                </div>
              </button>

              {/* 2. New Project */}
              <button
                type="button"
                onClick={() => setIsAddProjectModalOpen(true)}
                className="group relative flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.22] active:bg-white/[0.28] border border-white/20 hover:border-white/45 backdrop-blur-md shadow-xs hover:shadow-lg hover:shadow-blue-950/25 transition-all duration-200 hover:-translate-y-0.5 text-left text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs">
                  <FolderKanban className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-white tracking-tight leading-snug truncate">
                    New Project
                  </span>
                  <span className="block text-xs text-blue-100/75 font-medium truncate mt-0.5">
                    Assign task
                  </span>
                </div>
              </button>

              {/* 3. Attendance */}
              <button
                type="button"
                onClick={() => navigate('/admin/attendance')}
                className="group relative flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.22] active:bg-white/[0.28] border border-white/20 hover:border-white/45 backdrop-blur-md shadow-xs hover:shadow-lg hover:shadow-blue-950/25 transition-all duration-200 hover:-translate-y-0.5 text-left text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs">
                  <FileSpreadsheet className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-white tracking-tight leading-snug truncate">
                    Attendance
                  </span>
                  <span className="block text-xs text-blue-100/75 font-medium truncate mt-0.5">
                    Daily roster
                  </span>
                </div>
              </button>

              {/* 4. Departments */}
              <button
                type="button"
                onClick={() => navigate('/admin/departments')}
                className="group relative flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.22] active:bg-white/[0.28] border border-white/20 hover:border-white/45 backdrop-blur-md shadow-xs hover:shadow-lg hover:shadow-blue-950/25 transition-all duration-200 hover:-translate-y-0.5 text-left text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs">
                  <Building2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-white tracking-tight leading-snug truncate">
                    Departments
                  </span>
                  <span className="block text-xs text-blue-100/75 font-medium truncate mt-0.5">
                    Manage units
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Five KPI Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
        {/* Total Employees */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/admin/employees')}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-slate-900">{totalEmployees}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-xs sm:text-[13px] text-slate-400 font-medium">
            Across {totalDepartments} departments
          </div>
        </div>

        {/* Active Today */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/admin/attendance')}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Active Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-emerald-600">{activeToday}</span>
            <span className="text-sm text-slate-400 font-mono">/ {totalEmployees}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-xs sm:text-[13px] text-slate-400 font-medium">Presence Rate</span>
            <span className="text-xs sm:text-[13px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">{attendanceRate}%</span>
          </div>
        </div>

        {/* Currently Working */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/admin/daily-activities')}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Working Now</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-blue-600">{currentlyWorking}</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-xs sm:text-[13px] text-slate-400 font-medium">
            In active shifts right now
          </div>
        </div>

        {/* Not Joined */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/admin/attendance')}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Not Joined</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shadow-2xs">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-amber-600">{notJoinedToday}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-xs sm:text-[13px] text-amber-600 font-bold">
            Pending check-in today
          </div>
        </div>

        {/* Total Projects */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer col-span-2 sm:col-span-1" onClick={() => navigate('/admin/projects')}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shadow-2xs">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-slate-900">{totalProjects}</span>
            <span className="text-xs text-slate-400 font-mono">across {totalDepartments} units</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-xs sm:text-[13px] text-slate-400 font-medium">Permanent</span>
            <span className="text-xs sm:text-[13px] text-blue-600 font-bold cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate('/admin/projects'); }}>
              View All →
            </span>
          </div>
        </div>
      </div>

      {/* 3. Department Operational Panels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-slate-900">
              Department Operational Workspaces
            </h2>
          </div>
          <button
            onClick={() => navigate('/admin/departments')}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5"
          >
            Manage Units
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {departments.map((dept) => {
            const deptEmployees = employees.filter((e) =>
              e.assignedDepartments.includes(dept.id)
            );
            const deptProjects = projects.filter((p) => p.departmentId === dept.id);
            const deptWorking = activities.filter(
              (a) => a.date === today && a.departmentId === dept.id && a.status === 'working'
            ).length;

            const latestNote = getDeptLatestActivityNote(dept.id);
            const projectTags = getDeptProjects(dept.id);

            return (
              <DepartmentCard
                key={dept.id}
                department={dept}
                employeeCount={deptEmployees.length}
                projectCount={deptProjects.length}
                currentlyWorkingCount={deptWorking}
                recentActivityNote={latestNote}
                projectTags={projectTags}
                departmentEmployees={deptEmployees}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Live Activity Table + Attendance Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Activity Table (spans 2 columns) */}
        <div className="xl:col-span-2">
          <RecentActivityTable
            activities={todayActivities.length > 0 ? todayActivities : activities}
            limit={7}
            onViewAll={() => navigate('/admin/daily-activities')}
          />
        </div>

        {/* Attendance Summary */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider mb-3">
              Attendance Summary
            </h3>

            <div className="relative h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(20,38,83,0.1)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      fontSize: '13px',
                      padding: '8px 14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{attendanceRate}%</span>
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Present</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
                <span className="text-slate-700 font-semibold">Working</span>
              </span>
              <span className="font-extrabold text-slate-900 font-mono text-base">{currentlyWorking}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-slate-700 font-semibold">Completed</span>
              </span>
              <span className="font-extrabold text-slate-900 font-mono text-base">{completedToday}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-700 font-semibold">Not Joined</span>
              </span>
              <span className="font-extrabold text-slate-900 font-mono text-base">{notJoinedToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Activity Analytics Chart */}
      <ActivityChart />

      {/* Modals triggered by Quick Actions */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        departments={departments}
        onAdd={addEmployee}
      />

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        departments={departments}
        onAdd={(data) => {
          addProject({
            name: data.name,
            departmentId: data.departmentId,
            description: data.description,
            createdBy: currentUser?.id,
            createdByName: currentUser?.fullName || 'Chandu',
          });
        }}
      />
    </div>
  );
};
