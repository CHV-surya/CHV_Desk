import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  CalendarCheck,
  Clock,
  Settings,
  History,
  LogOut,
  X,
  Briefcase,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { logout, currentUser } = useAuth();

  const navGroups = [
    {
      group: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Daily Activities', path: '/admin/daily-activities', icon: Clock },
        { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { name: 'My Work', path: '/employee/activity', icon: Briefcase },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { name: 'Departments', path: '/admin/departments', icon: Building2 },
        { name: 'Employees', path: '/admin/employees', icon: Users },
        { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
        { name: 'Digital Marketing', path: '/admin/digital-marketing', icon: TrendingUp },
        { name: 'Scheduler', path: '/admin/scheduler', icon: CalendarDays },
        { name: 'Tax Invoice', path: '/admin/tax-invoice', icon: Receipt },
        { name: 'Quotation', path: '/admin/quotation', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'Data Retention', path: '/admin/retention', icon: History },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#142653] text-slate-200 flex flex-col border-r border-[#1e3a7a]/60 shadow-xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-white/[0.08] bg-[#0f1d3f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md font-extrabold text-base tracking-wider">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                  WorkTrack
                </span>
                <span className="text-xs font-mono uppercase bg-blue-500/25 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md font-bold tracking-wider">
                  OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide font-medium mt-0.5">
                Enterprise Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 pb-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-5 h-5 flex-shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-blue-200 opacity-90" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logged-in User Profile Block */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0f1d3f]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={currentUser?.fullName || 'Chandu'}
                size="md"
                className="w-9 h-9 border-2 border-white/25 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {currentUser?.fullName || 'Chandu'}
                </p>
                <p className="text-xs text-blue-300 truncate font-medium mt-0.5">Administrator</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
