import React, { useState } from 'react';
import { Eye, Calendar } from 'lucide-react';
import { DailyActivity } from '../../types';
import { Badge } from '../common/Badge';
import { ActivityDetailModal } from './ActivityDetailModal';

interface ActivityTableProps {
  activities: DailyActivity[];
  showEmployeeName?: boolean;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  activities,
  showEmployeeName = true,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold">Date</th>
              {showEmployeeName && <th className="py-3.5 px-4 font-bold">Employee</th>}
              <th className="py-3.5 px-3.5 font-bold">Department</th>
              <th className="py-3.5 px-3.5 font-bold">Join Time</th>
              <th className="py-3.5 px-3.5 font-bold">End Time</th>
              <th className="py-3.5 px-3.5 font-bold">Duration</th>
              <th className="py-3.5 px-3.5 font-bold">Status</th>
              <th className="py-3.5 px-4 font-bold">Notes Summary</th>
              <th className="py-3.5 px-4 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={showEmployeeName ? 9 : 8}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  No daily activity records found.
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono text-xs sm:text-[13px] text-slate-700 font-medium">
                    {act.date}
                  </td>

                  {/* Employee Name (if admin view) */}
                  {showEmployeeName && (
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 flex-shrink-0 shadow-2xs">
                          {act.employeeName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] truncate">
                          {act.employeeName}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Department */}
                  <td className="py-3.5 px-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {act.departmentName}
                    </span>
                  </td>

                  {/* Join Time */}
                  <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-700 font-medium">
                    {act.joinTime || <span className="text-slate-300 font-sans">—</span>}
                  </td>

                  {/* End Time */}
                  <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-700 font-medium">
                    {act.endTime || <span className="text-slate-300 font-sans">—</span>}
                  </td>

                  {/* Working Hours */}
                  <td className="py-3.5 px-3.5 font-mono font-bold text-xs sm:text-[13px] text-emerald-700">
                    {act.workingHours || (act.joinTime ? <span className="text-blue-600 font-medium font-sans">Active...</span> : '—')}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3.5">
                    <Badge status={act.status} dot size="md" />
                  </td>

                  {/* Notes Preview */}
                  <td className="py-3.5 px-4 text-xs sm:text-[13px] text-slate-600 max-w-xs truncate font-medium">
                    {act.notes ? (
                      <span className="truncate block" title={act.notes}>{act.notes}</span>
                    ) : (
                      <span className="text-slate-300 italic">No notes</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedActivity(act)}
                      className="px-3 py-1.5 text-xs sm:text-[13px] font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-2xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
};
