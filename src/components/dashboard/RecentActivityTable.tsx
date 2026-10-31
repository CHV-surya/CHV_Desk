import React, { useState, useEffect, useCallback } from 'react';
import { Eye, ArrowRight, User, Clock, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { DailyActivity } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { ActivityDetailModal } from '../activity/ActivityDetailModal';
import { useData } from '../../context/DataContext';

interface RecentActivityTableProps {
  activities: DailyActivity[];
  limit?: number;
  onViewAll?: () => void;
}

/**
 * Parse a 12-hour time string like "09:15 AM" or "1:05 PM" into
 * a Date object for today (used for elapsed-time calculation).
 */
const parseTimeToDate = (timeStr: string): Date | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

/**
 * Calculate elapsed working duration.
 * - For "working" employees: joinTime → current system time (live).
 * - For "completed" employees: joinTime → endTime (final).
 * Always returns a formatted string like "3h 42m" or "18m", or null if no joinTime.
 */
const calcElapsed = (joinTime: string | null, endTime: string | null): string | null => {
  if (!joinTime) return null;
  const start = parseTimeToDate(joinTime);
  if (!start) return null;
  const end = endTime ? parseTimeToDate(endTime) : new Date();
  if (!end) return null;

  let diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) diffMs = 0;

  const totalMinutes = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  activities,
  limit = 7,
  onViewAll,
}) => {
  const { projects, employees } = useData();
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);
  const [statusTab, setStatusTab] = useState<'all' | 'working' | 'completed' | 'not-joined'>('all');

  // Re-render every 60 seconds so elapsed times for "working" rows stay fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Filter based on tab
  const filteredActivities = activities.filter((a) => {
    if (statusTab === 'all') return true;
    return a.status === statusTab;
  });

  const displayList = limit ? filteredActivities.slice(0, limit) : filteredActivities;

  // Look up avatar for an employee
  const getAvatar = useCallback(
    (empId: string) => employees.find((e) => e.id === empId)?.avatar,
    [employees],
  );

  const getAssociatedProject = (empId: string, deptId: string) => {
    const proj = projects.find(
      (p) => p.departmentId === deptId && p.createdBy === empId
    );
    return proj ? proj.name : 'General Task';
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
      {/* Header with Title and Filter Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-xs" />
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Live Workforce Activity Monitor
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">
              Real-time attendance clock-ins, duration, and session deliverables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Quick Filter Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100/80 rounded-xl text-xs sm:text-[13px] border border-slate-200/60">
            <button
              onClick={() => setStatusTab('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statusTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activities.length})
            </button>
            <button
              onClick={() => setStatusTab('working')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statusTab === 'working'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Working ({activities.filter((a) => a.status === 'working').length})
            </button>
            <button
              onClick={() => setStatusTab('completed')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statusTab === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({activities.filter((a) => a.status === 'completed').length})
            </button>
          </div>

          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-bold h-8"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Full Log
            </Button>
          )}
        </div>
      </div>

      {/* Enterprise Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 pl-4 pr-2 font-bold">Employee</th>
              <th className="py-2.5 px-2 font-bold">Department</th>
              <th className="py-2.5 px-2 font-bold hidden xl:table-cell">Project</th>
              <th className="py-2.5 px-2 font-bold">Joined</th>
              <th className="py-2.5 px-2 font-bold">End</th>
              <th className="py-2.5 px-2 font-bold">Duration</th>
              <th className="py-2.5 px-2 font-bold">Status</th>
              <th className="py-2.5 pl-2 pr-4 text-right font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                  <Activity className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                  No activity records match the selected status filter.
                </td>
              </tr>
            ) : (
              displayList.map((activity) => {
                const avatar = getAvatar(activity.employeeId);
                // Always compute dynamically from timestamps
                const elapsed = calcElapsed(activity.joinTime, activity.endTime);

                return (
                  <tr key={activity.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Employee with avatar */}
                    <td className="py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          name={activity.employeeName}
                          size="xs"
                          className="w-7 h-7 text-[11px] border border-slate-200/80 flex-shrink-0 shadow-2xs"
                        />
                        <span className="font-bold text-slate-900 text-[13px] truncate max-w-[120px]">
                          {activity.employeeName}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-slate-200/80 text-slate-600 shadow-2xs truncate max-w-[110px]">
                        {activity.departmentName}
                      </span>
                    </td>

                    {/* Project — hidden on smaller xl breakpoints */}
                    <td className="py-2.5 px-2 text-slate-600 font-medium text-[13px] hidden xl:table-cell">
                      <span className="truncate block max-w-[120px]">
                        {getAssociatedProject(activity.employeeId, activity.departmentId)}
                      </span>
                    </td>

                    {/* Join Time */}
                    <td className="py-2.5 px-2 font-mono text-xs text-slate-700 font-medium whitespace-nowrap">
                      {activity.joinTime || <span className="text-slate-300 font-sans">—</span>}
                    </td>

                    {/* End Time */}
                    <td className="py-2.5 px-2 font-mono text-xs text-slate-700 font-medium whitespace-nowrap">
                      {activity.endTime || <span className="text-slate-300 font-sans">—</span>}
                    </td>

                    {/* Working Hours — dynamically computed */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {elapsed ? (
                        activity.status === 'working' ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-blue-700">
                            <Clock className="w-3 h-3 text-blue-500 animate-pulse flex-shrink-0" />
                            {elapsed}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-xs text-emerald-700">
                            {elapsed}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300 font-sans text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2">
                      <Badge status={activity.status} dot size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pl-2 pr-4 text-right">
                      <button
                        onClick={() => setSelectedActivity(activity)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg border border-slate-200/80 hover:border-blue-200 transition-all shadow-2xs whitespace-nowrap"
                        title="Inspect full activity notes"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
};
