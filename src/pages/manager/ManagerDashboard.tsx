import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  FolderKanban,
  Building2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { RecentActivityTable } from '../../components/dashboard/RecentActivityTable';
import { DepartmentCard } from '../../components/dashboard/DepartmentCard';

interface ManagerDashboardData {
  kpis: {
    totalEmployees: number;
    activeToday: number;
    currentlyWorking: number;
    completedToday: number;
    notJoinedToday: number;
    attendanceRate: number;
    totalProjects: number;
    totalDepartments: number;
  };
  donutData: { name: string; value: number; color: string }[];
  departments: {
    id: string;
    name: string;
    slug: string;
    color: string;
    totalEmployees: number;
    activeToday: number;
    totalProjects: number;
    latestNotes?: string;
  }[];
  recentActivities: any[];
  assignedDepartments: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
}

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { departments, addProject } = useData();

  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<ManagerDashboardData>('/dashboard/manager');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load manager dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Greeting based on Indian Standard Time (IST)
  const getGreeting = () => {
    const hour = parseInt(
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }),
      10
    );
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateDisplay = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const kpis = dashboardData?.kpis || {
    totalEmployees: 0,
    activeToday: 0,
    currentlyWorking: 0,
    completedToday: 0,
    notJoinedToday: 0,
    attendanceRate: 0,
    totalProjects: 0,
    totalDepartments: 0,
  };

  const donutData = (dashboardData?.donutData || []).filter((d) => d.value > 0);
  if (donutData.length === 0) {
    donutData.push({ name: 'No Data', value: 1, color: '#E2E8F0' });
  }

  // Manager assigned departments list
  const managerDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {currentUser?.fullName || 'Manager'}
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              MANAGER WORKSPACE
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>{currentDateDisplay} (IST)</span>
            <span>•</span>
            <span>Managing {managerDepts.length} Assigned {managerDepts.length === 1 ? 'Unit' : 'Units'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/manager/projects')}
            icon={<FolderKanban className="w-4 h-4" />}
          >
            Manage Projects
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddProjectModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Staff in Assigned Units */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs border border-slate-200/80">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Staff</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-mono">
              {kpis.totalEmployees}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">In your assigned units</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Currently Working */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs border border-slate-200/80">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currently On Shift</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 font-mono">
              {kpis.currentlyWorking}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Active work day</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Shifts */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs border border-slate-200/80">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Today</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
              {kpis.completedToday}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Recorded end shift</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs border border-slate-200/80">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1 font-mono">
              {kpis.attendanceRate}%
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {kpis.activeToday} of {kpis.totalEmployees} present
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Managed Projects */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs border border-slate-200/80 col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-mono">
              {kpis.totalProjects}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Across your units</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 flex-shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Section: Attendance Donut Chart & Scope Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Donut Chart */}
        <div className="glass-card rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Today's Shift Attendance</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Department staff live status</p>
            </div>
            <button
              onClick={() => navigate('/manager/attendance')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 relative flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Members`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-mono text-slate-900">
                {kpis.attendanceRate}%
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Present
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Working
              </div>
              <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {kpis.currentlyWorking}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </div>
              <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {kpis.completedToday}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Not Joined
              </div>
              <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {kpis.notJoinedToday}
              </p>
            </div>
          </div>
        </div>

        {/* Manager Scope & Assigned Units */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Managed Departments</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    Strict department isolation active • You manage {managerDepts.length} units
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> SECURE SCOPE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
              {managerDepts.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">
                    {d.description || 'Department operations under your supervisory scope.'}
                  </p>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 text-xs font-semibold">
                    <button
                      onClick={() => navigate('/manager/projects')}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Projects
                    </button>
                    <button
                      onClick={() => navigate('/manager/employees')}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      View Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Only projects, employees, and activities within these units are accessible.</span>
            <span className="font-mono text-indigo-600 font-bold">Role: Manager</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Scoped to Manager's Units) */}
      <div className="glass-card rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Recent Department Activity Logs</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Activity notes and timestamps submitted by staff in your assigned departments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/manager/activities')}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            All Logs
          </Button>
        </div>

        <RecentActivityTable
          activities={dashboardData?.recentActivities || []}
        />
      </div>

      {/* Create Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        departments={managerDepts}
        onAdd={async (proj) => {
          await addProject(proj);
          await fetchDashboardData();
        }}
      />
    </div>
  );
};
