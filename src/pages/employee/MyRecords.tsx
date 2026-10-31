import React, { useState } from 'react';
import { Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ActivityTable } from '../../components/activity/ActivityTable';
import { SearchInput } from '../../components/common/SearchInput';
import { DateFilter } from '../../components/common/DateFilter';
import { getFormattedDate } from '../../data/mockData';

export const MyRecords: React.FC = () => {
  const { currentUser } = useAuth();
  const { activities } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<'all' | 'current'>('all');

  // Filter ONLY current employee's records
  const myActivities = activities.filter((a) => a.employeeId === currentUser?.id);

  const currentMonthStr = getFormattedDate().slice(0, 7); // YYYY-MM

  const filteredRecords = myActivities.filter((act) => {
    const matchesSearch =
      act.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !selectedDate || act.date === selectedDate;

    const matchesMonth =
      monthFilter === 'all' || act.date.startsWith(currentMonthStr);

    return matchesSearch && matchesDate && matchesMonth;
  });

  const totalDaysLogged = myActivities.length;
  const completedDays = myActivities.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Activity History & Records
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              {myActivities.length} Sessions
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Personal chronological audit of your working sessions, timestamps, and notes
          </p>
        </div>

        <DateFilter
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          showPresets={true}
        />
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Sessions Logged
          </span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalDaysLogged}</span>
            <span className="text-xs font-mono text-slate-400 font-medium">All assigned depts</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Completed Shifts
          </span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-600">{completedDays}</span>
            <span className="text-xs font-mono text-slate-400 font-medium">Full shift concluded</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Timeframe Scope
          </span>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={() => setMonthFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                monthFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setMonthFilter('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                monthFilter === 'current'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Current Month
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search within your personal activity notes..."
          />
        </div>

        <span className="text-xs sm:text-[13px] font-mono text-slate-500 font-semibold">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Records Table */}
      <ActivityTable activities={filteredRecords} showEmployeeName={false} />
    </div>
  );
};
