import React from 'react';
import { Calendar, Building2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getFormattedDate } from '../../data/mockData';
import { JoinEndTracker } from '../../components/activity/JoinEndTracker';
import { DailyNotes } from '../../components/activity/DailyNotes';

export const DailyActivityTrackerPage: React.FC = () => {
  const { currentUser, activeDepartmentId } = useAuth();
  const {
    departments,
    getEmployeeTodayActivity,
    joinToday,
    endToday,
    saveDailyNotes,
  } = useData();

  const activeDept = departments.find((d) => d.id === activeDepartmentId) || departments[0];
  const today = getFormattedDate();

  const todayActivity = currentUser
    ? getEmployeeTodayActivity(currentUser.id, activeDept?.id)
    : undefined;

  const handleJoin = () => {
    if (!currentUser || !activeDept) {
      return { success: false, message: 'Missing user or department.' };
    }
    return joinToday(currentUser.id, activeDept.id);
  };

  const handleEnd = () => {
    if (!currentUser || !activeDept) {
      return { success: false, message: 'Missing user or department.' };
    }
    return endToday(currentUser.id, activeDept.id);
  };

  const handleSaveNotes = (notes: string) => {
    if (!currentUser || !activeDept) return;
    saveDailyNotes(currentUser.id, activeDept.id, notes);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daily Activity & Shift Tracker
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Capture work session attendance, record timestamps, and submit daily accomplishment logs
          </p>
        </div>

        {/* Date and Dept Badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-mono font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            {today}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 shadow-2xs">
            <Building2 className="w-4 h-4" />
            {activeDept?.name}
          </span>
        </div>
      </div>

      {/* JOIN & END Tracker Component */}
      <JoinEndTracker
        activity={todayActivity}
        onJoin={handleJoin}
        onEnd={handleEnd}
        departmentName={activeDept?.name || 'Department'}
      />

      {/* Daily Notes Component */}
      <DailyNotes
        initialNotes={todayActivity?.notes || ''}
        lastSavedTime={todayActivity?.lastSavedNotesTime}
        onSave={handleSaveNotes}
        isJoined={Boolean(todayActivity?.joinTime)}
      />

      {/* Usage Guide Notice */}
      <div className="glass-card rounded-2xl p-4.5 flex items-start gap-3 text-sm text-slate-600 font-medium shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800">Shift Operation Rules: </span>
          <span className="text-slate-600">
            <strong>JOIN</strong> is recorded once per date and locks upon submission. <strong>END</strong> can be clicked multiple times throughout the day; the system always retains your latest recorded timestamp. Always click <strong>Save Updates</strong> to commit your daily notes.
          </span>
        </div>
      </div>
    </div>
  );
};
