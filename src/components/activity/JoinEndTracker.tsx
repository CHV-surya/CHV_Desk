import React, { useState } from 'react';
import { LogIn, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { DailyActivity } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface JoinEndTrackerProps {
  activity?: DailyActivity;
  onJoin: () => { success: boolean; message: string } | Promise<{ success: boolean; message: string }>;
  onEnd: () => { success: boolean; message: string } | Promise<{ success: boolean; message: string }>;
  departmentName: string;
}

export const JoinEndTracker: React.FC<JoinEndTrackerProps> = ({
  activity,
  onJoin,
  onEnd,
  departmentName,
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const hasJoined = Boolean(activity?.joinTime);
  const status = activity?.status || 'not-joined';

  const handleJoinClick = async () => {
    setIsJoining(true);
    try {
      const result = await onJoin();
      setIsJoining(false);
      setFeedbackMessage({
        text: result.message,
        type: result.success ? 'success' : 'error',
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setIsJoining(false);
      setFeedbackMessage({
        text: err?.message || 'Failed to record join time',
        type: 'error',
      });
    }
  };

  const handleEndClick = async () => {
    setIsEnding(true);
    try {
      const result = await onEnd();
      setIsEnding(false);
      setFeedbackMessage({
        text: result.message,
        type: result.success ? 'success' : 'error',
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setIsEnding(false);
      setFeedbackMessage({
        text: err?.message || 'Failed to record end time',
        type: 'error',
      });
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7">
      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-[17px] font-extrabold uppercase tracking-wider text-slate-900">
              Shift Attendance Controller
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {departmentName}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
            System time is recorded automatically in 12-hour format upon action
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Session Status:</span>
          <Badge status={status} dot size="md" />
        </div>
      </div>

      {/* Notification banner if action clicked */}
      {feedbackMessage && (
        <div
          className={`mt-4 p-3.5 rounded-xl text-sm flex items-center gap-2.5 transition-all animate-in fade-in font-medium ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Action Buttons & Timestamps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {/* JOIN Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            hasJoined
              ? 'bg-slate-50 border-slate-200 opacity-90'
              : 'bg-blue-50/30 border-blue-200/80 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                  hasJoined ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
                }`}
              >
                <LogIn className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  JOIN WORK DAY
                </h4>
                <p className="text-xs text-slate-400 font-medium">Records official session start time</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Recorded Join Time
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-slate-900 mt-0.5 block">
                {activity?.joinTime ? (
                  activity.joinTime
                ) : (
                  <span className="text-slate-400 font-sans font-normal text-sm">Not recorded</span>
                )}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={hasJoined || isJoining}
              isLoading={isJoining}
              onClick={handleJoinClick}
              icon={<LogIn className="w-4 h-4" />}
              className="px-5"
            >
              {hasJoined ? 'Clocked In' : 'Click to JOIN'}
            </Button>
          </div>

          {hasJoined && (
            <p className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              JOIN is recorded once per calendar date.
            </p>
          )}
        </div>

        {/* END Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            !hasJoined
              ? 'bg-slate-50/50 border-slate-200 opacity-60'
              : 'bg-purple-50/30 border-purple-200/80 hover:border-purple-300 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                  hasJoined ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  END WORK DAY
                </h4>
                <p className="text-xs text-slate-400 font-medium">Can be updated multiple times throughout shift</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Latest End Recorded
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-slate-900 mt-0.5 block">
                {activity?.endTime ? (
                  activity.endTime
                ) : (
                  <span className="text-slate-400 font-sans font-normal text-sm">Session active</span>
                )}
              </span>
            </div>

            <Button
              variant="secondary"
              size="md"
              disabled={!hasJoined || isEnding}
              isLoading={isEnding}
              onClick={handleEndClick}
              icon={<LogOut className="w-4 h-4" />}
              className="px-5"
            >
              {activity?.endTime ? 'Update END' : 'Click to END'}
            </Button>
          </div>

          {activity?.workingHours && (
            <p className="text-xs text-purple-700 mt-2.5 flex items-center gap-1.5 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Shift Duration: {activity.workingHours}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
