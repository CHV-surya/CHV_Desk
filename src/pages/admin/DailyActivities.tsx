import React, { useState } from 'react';
import { Clock, Filter, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ActivityTable } from '../../components/activity/ActivityTable';
import { SearchInput } from '../../components/common/SearchInput';
import { DateFilter } from '../../components/common/DateFilter';
import { getFormattedDate } from '../../data/mockData';

export const DailyActivities: React.FC = () => {
  const { activities, departments, employees } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch = act.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || act.departmentId === selectedDept;

    const matchesEmp = selectedEmployee === 'all' || act.employeeId === selectedEmployee;

    const matchesDate = !selectedDate || act.date === selectedDate;

    return matchesSearch && matchesDept && matchesEmp && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daily Activities Monitor
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              {filteredActivities.length} Logs
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Audit workforce clock-ins, latest end timestamps, active working hours, and daily notes
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search by employee name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Search Employee / Keyword
            </label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or note..."
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2 h-10 text-sm bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3.5 py-2 h-10 text-sm bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              <option value="all">All Employees</option>
              {employees
                .filter((e) => e.role !== 'admin')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} (@{e.username})
                  </option>
                ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Date Filter
            </label>
            <DateFilter
              selectedDate={selectedDate}
              onChange={(d) => setSelectedDate(d || '')}
              showPresets={true}
            />
          </div>
        </div>

        {/* Active Filters Summary / Reset */}
        {(searchQuery || selectedDept !== 'all' || selectedEmployee !== 'all' || selectedDate) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filteredActivities.length} of {activities.length} records matching current filters
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
                setSelectedEmployee('all');
                setSelectedDate('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Activity Table */}
      <ActivityTable activities={filteredActivities} showEmployeeName={true} />
    </div>
  );
};
