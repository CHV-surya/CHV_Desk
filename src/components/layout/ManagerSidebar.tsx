import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarCheck,
  Clock,
  LogOut,
  X,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Building2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Avatar } from '../common/Avatar';

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ isOpen, onClose }) => {
  const { logout, currentUser, activeDepartmentId, setActiveDepartmentId } = useAuth();
  const { departments } = useData();

  // Assigned departments for this manager
  const assignedDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );

  const isDmAssigned = assignedDepts.some((d) => d.slug === 'digital-marketing');

  const navGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { name: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Projects', path: '/manager/projects', icon: FolderKanban },
        { name: 'Team Members', path: '/manager/employees', icon: Users },
        { name: 'Daily Activities', path: '/manager/activities', icon: Clock },
        { name: 'Attendance', path: '/manager/attendance', icon: CalendarCheck },
        ...(isDmAssigned
          ? [
              {
                name: 'Digital Marketing',
                path: '/manager/digital-marketing',
                icon: TrendingUp,
              },
            ]
          : []),
      ],
    },
    {
      group: 'PERSONAL',
      items: [{ name: 'My Work & Shift', path: '/employee/activity', icon: Briefcase }],
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md font-extrabold text-base tracking-wider">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                  WorkTrack
                </span>
                <span className="text-xs font-mono uppercase bg-indigo-500/25 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md font-bold tracking-wider">
                  MGR
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide font-medium mt-0.5">
                Manager Workspace
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

        {/* Assigned departments section */}
        {assignedDepts.length > 0 && (
          <div className="p-3 mx-3.5 my-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Managed Units
              </span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold border border-indigo-400/20">
                {assignedDepts.length}
              </span>
            </div>

            <div className="space-y-1">
              {assignedDepts.map((dept) => {
                const isSelected = dept.id === activeDepartmentId;
                return (
                  <button
                    key={dept.id}
                    onClick={() => setActiveDepartmentId(dept.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3.5 py-2 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/manager/dashboard'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-indigo-200 opacity-90" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0f1d3f]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={currentUser?.fullName || 'Manager'}
                size="md"
                className="w-9 h-9 border-2 border-indigo-400/40 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {currentUser?.fullName}
                </p>
                <p className="text-xs text-indigo-300 truncate font-medium mt-0.5">
                  Manager
                </p>
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
