import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthYearSelectorProps {
  currentYear: number;
  currentMonth: number; // 1-12
  onChange: (year: number, month: number) => void;
  isLoading?: boolean;
}

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  currentYear,
  currentMonth,
  onChange,
  isLoading = false,
}) => {
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onChange(currentYear - 1, 12);
    } else {
      onChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onChange(currentYear + 1, 1);
    } else {
      onChange(currentYear, currentMonth + 1);
    }
  };

  // Generate year options around current year (e.g. 2024 to 2030)
  const currentActualYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentActualYear - 2 + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      {/* Left: Quick Prev / Next navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isLoading}
          title="Previous Month"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer border border-slate-200/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-sm font-bold text-slate-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isLoading}
          title="Next Month"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer border border-slate-200/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Dropdowns for direct jumping */}
      <div className="flex items-center gap-2">
        {/* Month Dropdown */}
        <select
          value={currentMonth}
          disabled={isLoading}
          onChange={(e) => onChange(currentYear, parseInt(e.target.value, 10))}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer shadow-2xs"
        >
          {MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select
          value={currentYear}
          disabled={isLoading}
          onChange={(e) => onChange(parseInt(e.target.value, 10), currentMonth)}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer shadow-2xs font-mono"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

