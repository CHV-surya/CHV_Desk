import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  CalendarDays,
  Filter,
  Check,
  Flame,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { TaskModal } from '../../components/scheduler/TaskModal';
import { SchedulerTask, SchedulerTaskClassification } from '../../types';
import { api } from '../../lib/api';

type CalendarViewMode = 'month' | 'week' | 'day';

export const AdminScheduler: React.FC = () => {
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SchedulerTask | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [deleteCandidate, setDeleteCandidate] = useState<SchedulerTask | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<SchedulerTask[]>('/scheduler/tasks');
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load scheduler tasks:', err);
      setError(err?.message || 'Failed to load scheduler tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Date Navigation
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const delta = direction === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);

    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else {
      newDate.setDate(newDate.getDate() + delta);
    }

    setCurrentDate(newDate);
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        classificationFilter === 'all' ||
        t.classification === classificationFilter ||
        t.status === classificationFilter;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, classificationFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const upcoming = tasks.filter((t) => t.classification === 'upcoming').length;
    const ongoing = tasks.filter((t) => t.classification === 'ongoing').length;
    const completed = tasks.filter((t) => t.classification === 'completed').length;
    const overdue = tasks.filter((t) => t.classification === 'overdue').length;

    return { total, upcoming, ongoing, completed, overdue };
  }, [tasks]);

  // Task actions
  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    status: 'pending' | 'completed';
  }) => {
    if (editingTask) {
      await api.patch(`/scheduler/tasks/${editingTask.id}`, data);
      showToast('success', `Task "${data.title}" updated successfully`);
    } else {
      await api.post('/scheduler/tasks', data);
      showToast('success', `Task "${data.title}" scheduled successfully`);
    }
    await fetchTasks();
  };

  const handleToggleStatus = async (task: SchedulerTask) => {
    try {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.patch(`/scheduler/tasks/${task.id}/status`, { status: nextStatus });
      showToast(
        'success',
        nextStatus === 'completed'
          ? `Marked "${task.title}" as completed`
          : `Reopened "${task.title}" as pending`
      );
      await fetchTasks();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/scheduler/tasks/${deleteCandidate.id}`);
      showToast('success', `Task "${deleteCandidate.title}" deleted`);
      setDeleteCandidate(null);
      await fetchTasks();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete task');
    }
  };

  // Helper: check if a task is active on a specific date (YYYY-MM-DD)
  const isTaskOnDate = (task: SchedulerTask, dateStr: string) => {
    return task.startDate <= dateStr && task.endDate >= dateStr;
  };

  // Helper: get color classes for task classification badge
  const getClassificationClasses = (classification: SchedulerTaskClassification) => {
    switch (classification) {
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
          dot: 'bg-emerald-500',
          border: 'border-emerald-300',
          label: 'Completed',
        };
      case 'overdue':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
          dot: 'bg-rose-500',
          border: 'border-rose-300',
          label: 'Overdue',
        };
      case 'ongoing':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          dot: 'bg-amber-500',
          border: 'border-amber-300',
          label: 'Ongoing',
        };
      case 'upcoming':
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
          dot: 'bg-blue-500',
          border: 'border-blue-300',
          label: 'Upcoming',
        };
    }
  };

  // Month Calendar Days Generator
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing days from next month to complete 35 or 42 grid
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  // Week Days Generator
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  // Day View specific string
  const currentDayStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  }, [currentDate]);

  const tasksForCurrentDay = useMemo(() => {
    return filteredTasks.filter((t) => isTaskOnDate(t, currentDayStr));
  }, [filteredTasks, currentDayStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[99999] px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-sm font-semibold animate-in slide-in-from-top-2 duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Task Scheduler
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Organize administrative milestones, track upcoming deadlines, and monitor ongoing project tasks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingTask(null);
              setModalInitialDate(todayStr);
              setIsTaskModalOpen(true);
            }}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Tasks</span>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats.total}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase">Upcoming</span>
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-900 font-mono mt-1">{stats.upcoming}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">Ongoing</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-900 font-mono mt-1">{stats.ongoing}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono mt-1">{stats.completed}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-900 font-mono mt-1">{stats.overdue}</p>
        </div>
      </div>

      {/* Calendar Controls & Filters Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation & Current Month/Week */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {viewMode === 'month' &&
              currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' &&
              `Week of ${weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {viewMode === 'day' &&
              currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Classifications</option>
            <option value="upcoming">Upcoming Only</option>
            <option value="ongoing">Ongoing Only</option>
            <option value="completed">Completed Only</option>
            <option value="overdue">Overdue Only</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. MONTH VIEW                                                  */}
      {/* ============================================================== */}
      {viewMode === 'month' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((day, idx) => {
              const dayTasks = filteredTasks.filter((t) => isTaskOnDate(t, day.dateStr));

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 transition-colors relative group flex flex-col justify-between ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                  } ${day.isToday ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : day.isCurrentMonth
                          ? 'text-slate-700 font-extrabold'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Quick Add Button */}
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setModalInitialDate(day.dateStr);
                        setIsTaskModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      title={`Add task for ${day.dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Pills in Day Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin flex-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const color = getClassificationClasses(task.classification);

                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold truncate cursor-pointer transition-all flex items-center justify-between gap-1 shadow-2xs ${color.bg}`}
                          title={`${task.title}\nStatus: ${task.status.toUpperCase()} (${task.classification.toUpperCase()})\nPeriod: ${task.startDate} to ${task.endDate}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                            <span className={task.status === 'completed' ? 'line-through text-slate-500' : ''}>
                              {task.title}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(task);
                            }}
                            className="text-slate-400 hover:text-slate-800 p-0.5 rounded"
                            title={task.status === 'completed' ? 'Reopen task' : 'Mark completed'}
                          >
                            {task.status === 'completed' ? (
                              <RotateCcw className="w-2.5 h-2.5" />
                            ) : (
                              <Check className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div
                        onClick={() => {
                          setCurrentDate(new Date(day.dateStr));
                          setViewMode('day');
                        }}
                        className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer pl-1"
                      >
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. WEEK VIEW                                                   */}
      {/* ============================================================== */}
      {viewMode === 'week' && (
        <div className="glass-card rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayTasks = filteredTasks.filter((t) => isTaskOnDate(t, day.dateStr));

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border p-3 flex flex-col justify-between min-h-[300px] ${
                    day.isToday
                      ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-500/30'
                      : 'border-slate-200/80 bg-white'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block">{day.dayName}</span>
                      <span
                        className={`text-base font-extrabold ${
                          day.isToday ? 'text-blue-600 font-black' : 'text-slate-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setModalInitialDate(day.dateStr);
                        setIsTaskModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Add task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tasks in Day */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-slate-300 italic text-center py-6">No tasks</p>
                    ) : (
                      dayTasks.map((task) => {
                        const color = getClassificationClasses(task.classification);

                        return (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded-xl border transition-all text-xs shadow-2xs ${color.bg}`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span
                                className={`font-bold leading-tight ${
                                  task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              <span
                                className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-black border ${color.border}`}
                              >
                                {color.label}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}

                            {task.startTime && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono mb-2">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
                              <button
                                onClick={() => handleToggleStatus(task)}
                                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                              >
                                {task.status === 'completed' ? (
                                  <>
                                    <RotateCcw className="w-3 h-3" /> Reopen
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" /> Complete
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeleteCandidate(task)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DAY VIEW                                                    */}
      {/* ============================================================== */}
      {viewMode === 'day' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Scheduled Agenda for{' '}
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tasksForCurrentDay.length} task{tasksForCurrentDay.length === 1 ? '' : 's'} assigned to or active on this date
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingTask(null);
                setModalInitialDate(currentDayStr);
                setIsTaskModalOpen(true);
              }}
            >
              Add Task for Today
            </Button>
          </div>

          {tasksForCurrentDay.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-base">No Tasks Scheduled for this Date</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                Click "+ New Task" or "Add Task for Today" to plan meetings, audits, or administrative deliverables.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForCurrentDay.map((task) => {
                const color = getClassificationClasses(task.classification);

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${color.bg}`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-black text-base ${
                            task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-xs font-mono uppercase font-black px-2 py-0.5 rounded-md border ${color.border}`}
                        >
                          {color.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 max-w-2xl font-medium">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          {task.startDate} to {task.endDate}
                        </span>
                        {task.startTime && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                          </span>
                        )}
                        {task.createdByName && (
                          <span className="text-slate-400">Created by {task.createdByName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant={task.status === 'completed' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(task)}
                        icon={task.status === 'completed' ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      >
                        {task.status === 'completed' ? 'Reopen' : 'Mark Complete'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTask(task);
                          setIsTaskModalOpen(true);
                        }}
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteCandidate(task)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        initialDate={modalInitialDate}
        onSave={handleSaveTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteTask}
        title="Delete Scheduled Task"
        message={`Are you sure you want to permanently delete the task "${deleteCandidate?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete Task"
        variant="danger"
      />
    </div>
  );
};
