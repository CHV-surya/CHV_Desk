import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Clock,
  ChevronDown,
  LogOut,
  User,
  Building2,
  CheckCircle2,
  Settings,
  Check,
  LogIn,
  FolderKanban,
  FileText,
  X,
  Search,
  Calendar,
  BellOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'join' | 'end' | 'notes' | 'project';
  deptName?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Alex Rivera clocked in',
    message: 'Recorded JOIN at 09:05 AM for Dental Care project.',
    time: '15m ago',
    isRead: false,
    type: 'join',
    deptName: 'Software',
  },
  {
    id: 'notif-2',
    title: 'Surya Sharma completed shift',
    message: 'Work day ended with 8h 50m duration recorded.',
    time: '45m ago',
    isRead: false,
    type: 'end',
    deptName: 'Digital Marketing',
  },
  {
    id: 'notif-3',
    title: 'Sarah Jenkins saved daily notes',
    message: 'Updated work deliverables for Company Promotional Videos.',
    time: '2h ago',
    isRead: false,
    type: 'notes',
    deptName: 'Video Editor',
  },
  {
    id: 'notif-4',
    title: 'New project created',
    message: 'A new permanent project record was registered.',
    time: '4h ago',
    isRead: true,
    type: 'project',
    deptName: 'Software',
  },
];

const NOTIFICATIONS_STORAGE_KEY = 'worktrack_notifications_list';

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, logout, activeDepartmentId, setActiveDepartmentId, isAdmin } = useAuth();
  const { departments, getEmployeeTodayActivity } = useData();

  // Dropdown visibility states
  const [showDeptDropdown, setShowDeptDropdown] = useState<boolean>(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);

  // Global search input state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal states from Profile dropdown
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState<boolean>(false);

  // Password change state inside Account Settings modal
  const [empCurrentPwd, setEmpCurrentPwd] = useState('');
  const [empNewPwd, setEmpNewPwd] = useState('');
  const [empConfirmPwd, setEmpConfirmPwd] = useState('');
  const [empPwdMessage, setEmpPwdMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Dropdown DOM refs for click-outside detection
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Live system clock in 12-hour AM/PM format
  const getFormattedTime = (): string => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getFormattedHeaderDate = (): string => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [currentTime, setCurrentTime] = useState<string>(getFormattedTime);
  const [currentDate] = useState<string>(getFormattedHeaderDate);

  useEffect(() => {
    setCurrentTime(getFormattedTime());
    const interval = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setShowDeptDropdown(false);
        setShowNotificationDropdown(false);
        setShowProfileDropdown(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(target)) {
        setShowDeptDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(target)) {
        setShowNotificationDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDeptDropdown = () => {
    setShowDeptDropdown((prev) => !prev);
    setShowNotificationDropdown(false);
    setShowProfileDropdown(false);
  };

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown((prev) => !prev);
    setShowDeptDropdown(false);
    setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
    setShowDeptDropdown(false);
    setShowNotificationDropdown(false);
  };

  // Departments list based on role
  const userDepartments = isAdmin
    ? departments
    : departments.filter((d) => currentUser?.assignedDepartments?.includes(d.id));

  const activeDept =
    departments.find((d) => d.id === activeDepartmentId) ||
    userDepartments[0] ||
    departments[0];

  // Today activity status
  const todayActivity = currentUser
    ? getEmployeeTodayActivity(currentUser.id, activeDepartmentId || undefined)
    : undefined;

  const handleSelectDepartment = (deptId: string) => {
    setActiveDepartmentId(deptId);
    setShowDeptDropdown(false);
  };

  const handleMyProfileClick = () => {
    setShowProfileDropdown(false);
    setIsProfileModalOpen(true);
  };

  const handleAccountSettingsClick = () => {
    setShowProfileDropdown(false);
    if (isAdmin) {
      navigate('/admin/settings');
    } else {
      setIsAccountSettingsModalOpen(true);
    }
  };

  const handleLogoutClick = () => {
    setShowProfileDropdown(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleEmpPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCurrentPwd) {
      setEmpPwdMessage({ text: 'Please enter your current password.', success: false });
      return;
    }
    if (empNewPwd.length < 6) {
      setEmpPwdMessage({ text: 'New password must be at least 6 characters.', success: false });
      return;
    }
    if (empNewPwd !== empConfirmPwd) {
      setEmpPwdMessage({ text: 'Passwords do not match.', success: false });
      return;
    }

    setEmpPwdMessage({ text: 'Password successfully updated!', success: true });
    setEmpCurrentPwd('');
    setEmpNewPwd('');
    setEmpConfirmPwd('');
    setTimeout(() => {
      setEmpPwdMessage(null);
      setIsAccountSettingsModalOpen(false);
    }, 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAdmin) {
        navigate(`/admin/daily-activities`);
      } else {
        navigate(`/employee/projects`);
      }
    }
  };

  return (
    <header className="glass-header sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-6 transition-all duration-150">
      {/* Left side: Hamburger (mobile) + Department Selector + Global Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 lg:hidden focus:outline-none transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 1. Department Selector Dropdown */}
        {userDepartments.length > 0 && (
          <div className="relative flex-shrink-0" ref={deptDropdownRef}>
            <button
              onClick={toggleDeptDropdown}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold bg-white/95 hover:bg-white text-slate-800 rounded-xl transition-all border border-slate-200/90 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-haspopup="true"
              aria-expanded={showDeptDropdown}
              title="Switch operational workspace"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-slate-100"
                style={{ backgroundColor: activeDept?.color || '#2563EB' }}
              />
              <span className="text-slate-400 font-medium">Dept:</span>
              <span className="font-bold text-slate-900 truncate max-w-[130px] sm:max-w-none">
                {activeDept?.name || 'Select Dept'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                  showDeptDropdown ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Department Dropdown Menu */}
            {showDeptDropdown && (
              <div
                className="glass-modal absolute left-0 mt-2 w-64 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAdmin ? 'All Departments' : 'Assigned Departments'}
                  </p>
                </div>

                <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                  {userDepartments.map((dept) => {
                    const isSelected = dept.id === activeDepartmentId;
                    return (
                      <button
                        key={dept.id}
                        onClick={() => handleSelectDepartment(dept.id)}
                        className={`flex items-center justify-between w-full px-3.5 py-2.5 text-sm rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dept.color }}
                          />
                          <span className="truncate">{dept.name}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Search Field */}
        <div className="hidden lg:block relative max-w-sm w-full">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, projects, employees..."
              className="w-full pl-10 pr-14 py-2 text-sm bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <kbd className="text-xs font-mono font-semibold text-slate-400 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>
      </div>

      {/* Right side: Current date, Live clock, notifications, User profile dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 bg-white/80 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200/80 shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Live System Clock (12-hour AM/PM format) */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/80 rounded-xl text-sm font-mono font-bold text-slate-800 border border-slate-200/80 shadow-2xs select-none">
          <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>{currentTime}</span>
        </div>

        {/* Employee Today's Status badge */}
        {!isAdmin && todayActivity && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today:</span>
            <Badge status={todayActivity.status} dot size="md" />
          </div>
        )}

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notificationDropdownRef}>
          <button
            onClick={toggleNotificationDropdown}
            className={`relative p-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              showNotificationDropdown
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/90 border border-transparent'
            }`}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={showNotificationDropdown}
            title="Activity Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotificationDropdown && (
            <div
              className="glass-modal absolute right-0 sm:right-auto sm:left-auto sm:-translate-x-1/2 mt-2 w-88 sm:w-96 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              role="dialog"
              aria-label="Notifications Panel"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <BellOff className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No recent notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const getIcon = () => {
                      switch (notif.type) {
                        case 'join':
                          return <LogIn className="w-4 h-4 text-blue-600" />;
                        case 'end':
                          return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
                        case 'notes':
                          return <FileText className="w-4 h-4 text-emerald-600" />;
                        case 'project':
                          return <FolderKanban className="w-4 h-4 text-amber-600" />;
                        default:
                          return <Bell className="w-4 h-4 text-slate-600" />;
                      }
                    };

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-3.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer my-1 ${
                          !notif.isRead
                            ? 'bg-blue-50/40 hover:bg-blue-50/80 border border-blue-100/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 shadow-2xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {getIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 shadow-xs" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-snug">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                            {notif.deptName && (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-sans font-semibold">
                                {notif.deptName}
                              </span>
                            )}
                            <span>{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex items-center justify-between px-4">
                  <span className="text-xs text-slate-400 font-medium">Live Activity Stream</span>
                  <button
                    onClick={handleClearNotifications}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={toggleProfileDropdown}
            className={`flex items-center gap-3 p-1.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              showProfileDropdown ? 'bg-white shadow-xs border border-slate-200' : 'hover:bg-white/80'
            }`}
            aria-haspopup="true"
            aria-expanded={showProfileDropdown}
          >
            <div className="relative">
              <Avatar
                name={currentUser?.fullName || 'User'}
                size="md"
                className="w-9 h-9 border-2 border-slate-200 shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="hidden md:block text-left">
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {currentUser?.fullName}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {currentUser?.role === 'admin'
                  ? 'Administrator'
                  : departments.find((d) => d.id === activeDepartmentId)?.name || 'Specialist'}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-150 ${
                showProfileDropdown ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div
              className="glass-modal absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Signed in as</p>
                <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">{currentUser?.fullName}</p>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">@{currentUser?.username}</p>
                <div className="mt-2.5">
                  <Badge variant={isAdmin ? 'purple' : 'blue'} size="md">
                    {isAdmin ? 'System Admin' : 'Employee Specialist'}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleMyProfileClick}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <User className="w-4.5 h-4.5 text-slate-400" />
                  My Profile
                </button>

                <button
                  onClick={handleAccountSettingsClick}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <Settings className="w-4.5 h-4.5 text-slate-400" />
                  Account Settings
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. My Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Account Profile"
        subtitle="Credentials, assigned units, and account role"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
            <Avatar
              name={currentUser?.fullName || 'User'}
              size="xl"
              className="w-16 h-16 rounded-2xl text-2xl border-2 border-slate-200 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-lg font-bold text-slate-900 truncate">
                {currentUser?.fullName}
              </h4>
              <p className="text-sm text-slate-400 font-mono">@{currentUser?.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge status={currentUser?.status || 'active'} dot size="md" />
                <Badge variant={isAdmin ? 'purple' : 'blue'} size="md">
                  {isAdmin ? 'System Admin' : 'Employee'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">
                Email Address
              </span>
              <span className="font-semibold text-slate-800 break-all">{currentUser?.email}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">
                Registered Date
              </span>
              <span className="font-semibold text-slate-800">
                {currentUser?.createdAt || '2024-01-01'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-xs uppercase font-bold block mb-2">
              Assigned Operational Departments ({userDepartments.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {userDepartments.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border shadow-2xs"
                  style={{
                    backgroundColor: `${d.color}10`,
                    borderColor: `${d.color}30`,
                    color: d.color,
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                  {d.id === activeDepartmentId && (
                    <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                      Active
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="primary" size="md" onClick={() => setIsProfileModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Employee Account Settings Modal */}
      {!isAdmin && (
        <Modal
          isOpen={isAccountSettingsModalOpen}
          onClose={() => {
            setIsAccountSettingsModalOpen(false);
            setEmpPwdMessage(null);
          }}
          title="Security Settings"
          subtitle="Change account password"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {empPwdMessage && (
              <div
                className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 ${
                  empPwdMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {empPwdMessage.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-semibold">{empPwdMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleEmpPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={empCurrentPwd}
                  onChange={(e) => setEmpCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={empNewPwd}
                  onChange={(e) => setEmpNewPwd(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={empConfirmPwd}
                  onChange={(e) => setEmpConfirmPwd(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsAccountSettingsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </header>
  );
};
