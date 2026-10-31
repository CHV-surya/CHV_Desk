import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getFormattedDate } from '../../data/mockData';
import { StatCard } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchInput } from '../../components/common/SearchInput';
import { DateFilter } from '../../components/common/DateFilter';

export const Attendance: React.FC = () => {
  const { employees, departments, activities } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate());

  const staffEmployees = employees.filter((e) => e.role !== 'admin');

  // Compute attendance record for each employee on the selected date
  const attendanceList = staffEmployees.map((emp) => {
    const empActivity = activities.find(
      (a) => a.employeeId === emp.id && a.date === selectedDate
    );

    const empDepts = departments
      .filter((d) => emp.assignedDepartments.includes(d.id))
      .map((d) => d.name);

    const status = empActivity ? empActivity.status : 'not-joined';

    return {
      employee: emp,
      departments: empDepts,
      joinTime: empActivity?.joinTime || null,
      endTime: empActivity?.endTime || null,
      workingHours: empActivity?.workingHours || null,
      status,
      notes: empActivity?.notes || '',
    };
  });

  const totalEmployees = staffEmployees.length;
  const currentlyWorking = attendanceList.filter((a) => a.status === 'working').length;
  const completed = attendanceList.filter((a) => a.status === 'completed').length;
  const joinedToday = currentlyWorking + completed;
  const notJoined = totalEmployees - joinedToday;

  const filteredAttendance = attendanceList.filter((item) => {
    const matchesSearch =
      item.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employee.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === 'all' ||
      item.employee.assignedDepartments.includes(departmentFilter);

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Workforce Attendance Log
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Real-time daily presence, check-in status, and shift fulfillment
          </p>
        </div>

        <DateFilter
          selectedDate={selectedDate}
          onChange={(d) => setSelectedDate(d || getFormattedDate())}
          showPresets={true}
        />
      </div>

      {/* 5 Compact Attendance Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Headcount"
          value={totalEmployees}
          icon={Users}
          color="slate"
          subtitle="Staff roster"
        />
        <StatCard
          title="Joined Today"
          value={joinedToday}
          icon={UserCheck}
          color="green"
          subtitle={`${Math.round((joinedToday / (totalEmployees || 1)) * 100)}% attendance rate`}
        />
        <StatCard
          title="Not Joined"
          value={notJoined}
          icon={UserX}
          color="orange"
          subtitle="Pending check-in"
        />
        <StatCard
          title="Working Now"
          value={currentlyWorking}
          icon={Activity}
          color="blue"
          subtitle="Active shift timers"
        />
        <StatCard
          title="Completed"
          value={completed}
          icon={CheckCircle2}
          color="purple"
          subtitle="Logged work day done"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search employee attendance..."
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="working">Currently Working</option>
            <option value="completed">Completed</option>
            <option value="not-joined">Not Joined</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Employee</th>
                <th className="py-3.5 px-3.5 font-bold">Assigned Units</th>
                <th className="py-3.5 px-3.5 font-bold">Status</th>
                <th className="py-3.5 px-3.5 font-bold">Join Time</th>
                <th className="py-3.5 px-3.5 font-bold">Latest End</th>
                <th className="py-3.5 px-3.5 font-bold">Working Hours</th>
                <th className="py-3.5 px-5 font-bold">Daily Notes Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No attendance records for the selected date and filters.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.employee.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={item.employee.fullName}
                          size="md"
                          className="w-8 h-8 border border-slate-200 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm sm:text-[15px] truncate">{item.employee.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono">@{item.employee.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {item.departments.map((deptName) => (
                          <span
                            key={deptName}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                          >
                            {deptName}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3.5">
                      <Badge status={item.status} dot size="md" />
                    </td>

                    {/* Join Time */}
                    <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-700 font-medium">
                      {item.joinTime || <span className="text-slate-300 font-sans">—</span>}
                    </td>

                    {/* End Time */}
                    <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-700 font-medium">
                      {item.endTime || <span className="text-slate-300 font-sans">—</span>}
                    </td>

                    {/* Working Hours */}
                    <td className="py-3.5 px-3.5 font-mono font-bold text-xs sm:text-[13px] text-emerald-700">
                      {item.workingHours || (item.joinTime ? <span className="text-blue-600 font-medium font-sans">Active...</span> : '—')}
                    </td>

                    {/* Daily Notes Summary */}
                    <td className="py-3.5 px-5 text-xs sm:text-[13px] text-slate-600 max-w-xs truncate font-medium">
                      {item.notes ? (
                        <span className="truncate block" title={item.notes}>
                          {item.notes}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">No notes recorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
