import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getFormattedDate } from '../../data/mockData';
import { StatCard } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchInput } from '../../components/common/SearchInput';
import { DateFilter } from '../../components/common/DateFilter';

export const ManagerAttendance: React.FC = () => {
  const { employees, departments, activities } = useData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate());

  // Manager assigned departments
  const managerDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );
  const managerDeptIds = new Set(managerDepts.map((d) => d.id));

  // Staff employees strictly belonging to manager's assigned departments (excluding admin)
  const scopedEmployees = employees.filter(
    (e) =>
      e.role !== 'admin' &&
      e.assignedDepartments?.some((deptId) => managerDeptIds.has(deptId))
  );

  // Compute attendance record for each employee on the selected date
  const attendanceList = scopedEmployees.map((emp) => {
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

  const totalEmployees = scopedEmployees.length;
  const currentlyWorking = attendanceList.filter((a) => a.status === 'working').length;
  const completed = attendanceList.filter((a) => a.status === 'completed').length;
  const joinedToday = currentlyWorking + completed;
  const notJoined = totalEmployees - joinedToday;

  const filteredAttendance = attendanceList.filter((item) => {
    const matchesSearch =
      item.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employee.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === 'all'
        ? true
        : item.employee.assignedDepartments.includes(departmentFilter);

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Department Attendance Log
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              {totalEmployees} Staff
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Real-time daily presence, check-in timestamps, and shift completion for your department personnel
          </p>
        </div>

        <DateFilter
          selectedDate={selectedDate}
          onChange={(d) => setSelectedDate(d || getFormattedDate())}
          showPresets={true}
        />
      </div>

      {/* Scope Notice */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-950 leading-relaxed font-medium">
          <strong>Supervised Units:</strong> Displaying attendance logs strictly for staff members belonging to ({managerDepts.map((d) => d.name).join(', ')}).
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Supervised Staff"
          value={totalEmployees}
          icon={Users}
          color="slate"
          subtitle="Department roster"
        />
        <StatCard
          title="Joined Today"
          value={joinedToday}
          icon={UserCheck}
          color="green"
          subtitle={`${Math.round((joinedToday / (totalEmployees || 1)) * 100)}% attendance`}
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
          subtitle="Active timers"
        />
        <StatCard
          title="Completed"
          value={completed}
          icon={CheckCircle2}
          color="purple"
          subtitle="Logged work done"
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
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Managed Units ({totalEmployees})</option>
            {managerDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({scopedEmployees.filter((e) => e.assignedDepartments.includes(d.id)).length})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="working">Currently Working</option>
            <option value="completed">Completed</option>
            <option value="not-joined">Not Joined</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-xs uppercase font-extrabold tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Departments</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Latest End Time</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Daily Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No attendance records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.employee.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.employee.fullName} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {item.employee.fullName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            @{item.employee.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.departments.map((dName) => (
                          <span
                            key={dName}
                            className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"
                          >
                            {dName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.joinTime || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.endTime || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {item.workingHours || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.status === 'working'
                            ? 'blue'
                            : item.status === 'completed'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {item.status === 'working'
                          ? 'Working'
                          : item.status === 'completed'
                          ? 'Completed'
                          : 'Not Joined'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={item.notes}>
                      {item.notes || <span className="text-slate-400 italic">No notes logged</span>}
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
