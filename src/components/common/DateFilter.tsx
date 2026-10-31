import React from 'react';
import { Calendar, X } from 'lucide-react';
import { getFormattedDate, getPastDate } from '../../data/mockData';

interface DateFilterProps {
  selectedDate: string; // YYYY-MM-DD or ''
  onChange: (date: string) => void;
  showPresets?: boolean;
  className?: string;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedDate,
  onChange,
  showPresets = true,
  className = '',
}) => {
  const today = getFormattedDate();
  const yesterday = getPastDate(1);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="relative flex items-center">
        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-8 py-2 h-10 bg-white text-sm font-mono font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        {selectedDate && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Clear date filter"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showPresets && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange('')}
            className={`px-3 py-2 h-10 rounded-xl border text-sm font-semibold transition-colors ${
              selectedDate === ''
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Dates
          </button>
          <button
            type="button"
            onClick={() => onChange(today)}
            className={`px-3 py-2 h-10 rounded-xl border text-sm font-semibold transition-colors ${
              selectedDate === today
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onChange(yesterday)}
            className={`px-3 py-2 h-10 rounded-xl border text-sm font-semibold transition-colors ${
              selectedDate === yesterday
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Yesterday
          </button>
        </div>
      )}
    </div>
  );
};
