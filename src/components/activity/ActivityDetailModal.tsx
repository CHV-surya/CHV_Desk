import React from 'react';
import { Clock, Calendar, Building2, FileText, CheckCircle2 } from 'lucide-react';
import { DailyActivity } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface ActivityDetailModalProps {
  activity: DailyActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
}) => {
  if (!activity) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Daily Activity Record"
      subtitle={`Date: ${activity.date}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Employee & Dept Profile Card */}
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
              {activity.employeeName.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">{activity.employeeName}</h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span>{activity.departmentName}</span>
                <span>•</span>
                <span>{activity.date}</span>
              </div>
            </div>
          </div>
          <Badge status={activity.status} dot size="md" />
        </div>

        {/* Timestamps Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Join Time
            </span>
            <p className="text-sm sm:text-base font-mono font-bold text-slate-800">
              {activity.joinTime || <span className="text-slate-400 font-sans font-normal">—</span>}
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Latest End
            </span>
            <p className="text-sm sm:text-base font-mono font-bold text-slate-800">
              {activity.endTime || <span className="text-slate-400 font-sans font-normal">—</span>}
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Duration
            </span>
            <p className="text-sm sm:text-base font-mono font-bold text-emerald-600">
              {activity.workingHours || (activity.joinTime ? 'Active...' : '0h 0m')}
            </p>
          </div>
        </div>

        {/* Full Daily Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs sm:text-[13px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Daily Accomplishment Notes
            </h5>
            {activity.lastSavedNotesTime && (
              <span className="text-xs text-slate-400 font-mono">
                Updated {activity.lastSavedNotesTime}
              </span>
            )}
          </div>
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl min-h-[120px] text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {activity.notes ? (
              activity.notes
            ) : (
              <span className="text-slate-400 italic">No daily notes entered yet for this date.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
