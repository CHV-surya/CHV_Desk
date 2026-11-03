import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileSpreadsheet,
  LogOut,
  X,
  Building2,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Avatar } from '../common/Avatar';
import chvappsLogo from '../../assets/chvapps-logo.png';

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, onClose }) => {
  const { logout, currentUser, activeDepartmentId, setActiveDepartmentId } = useAuth();
  const { departments } = useData();

  // Assigned departments for this employee
  const assignedDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );

  const isDmAssigned = assignedDepts.some((d) => d.slug === 'digital-marketing');

  const navigationItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Daily Activity', path: '/employee/activity', icon: Clock },
    { name: 'My Projects', path: '/employee/projects', icon: FolderKanban },
    ...(isDmAssigned
      ? [{ name: 'Digital Marketing', path: '/employee/digital-marketing', icon: TrendingUp }]
      : []),
    { name: 'My Records', path: '/employee/records', icon: FileSpreadsheet },
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
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-md shrink-0 border border-white/20">
              <img src={chvappsLogo} alt="CHVApps Logo" className="w-full h-full object-contain" />
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
                Workspace Portal
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
        <div className="p-3.5 mx-3.5 my-3 bg-white/[0.05] border border-white/[0.08] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              {assignedDepts.length > 1 ? 'Assigned Depts' : 'Department'}
            </span>
            <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-400/20">
              {assignedDepts.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {assignedDepts.map((dept) => {
              const isSelected = dept.id === activeDepartmentId;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDepartmentId(dept.id)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span className="truncate">{dept.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
            WORKSPACE
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
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
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0f1d3f]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={currentUser?.fullName || 'User'}
                size="md"
                className="w-9 h-9 border-2 border-white/25 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {currentUser?.fullName}
                </p>
                <p className="text-xs text-blue-300 truncate font-medium mt-0.5">
                  {departments.find((d) => d.id === activeDepartmentId)?.name || 'Specialist'}
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
