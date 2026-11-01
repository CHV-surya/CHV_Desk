import React, { useState } from 'react';
import { Users, Eye, Mail, Building2, ShieldCheck, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchInput } from '../../components/common/SearchInput';
import { EmployeeDetailModal } from '../../components/employees/EmployeeDetailModal';

export const ManagerEmployees: React.FC = () => {
  const { employees, departments } = useData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // Departments assigned to this manager
  const managerDepts = departments.filter((d) =>
    currentUser?.assignedDepartments?.includes(d.id)
  );
  const managerDeptIds = new Set(managerDepts.map((d) => d.id));

  // Filter employees strictly belonging to manager's assigned departments (excluding admin)
  const scopedEmployees = employees.filter(
    (emp) =>
      emp.role !== 'admin' &&
      emp.assignedDepartments?.some((deptId) => managerDeptIds.has(deptId))
  );

  const filteredEmployees = scopedEmployees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === 'all' || emp.assignedDepartments.includes(departmentFilter);

    const matchesStatus =
      statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getDepartmentNames = (deptIds: string[]) => {
    return deptIds
      .map((id) => departments.find((d) => d.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Department Team Members
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              {scopedEmployees.length} Staff
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Personnel and team specialist roster across your supervised department units
          </p>
        </div>
      </div>

      {/* Scope Notice */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-950 leading-relaxed font-medium">
          <strong>Department Isolation:</strong> You are viewing team members assigned to your managed departments ({managerDepts.map((d) => d.name).join(', ')}). Account creation and credential provisioning require Administrator access.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, @username, or email..."
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 h-10 text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Managed Units ({scopedEmployees.length})</option>
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
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Team Member</th>
                <th className="py-3.5 px-3.5 font-bold">Username</th>
                <th className="py-3.5 px-3.5 font-bold">Assigned Units</th>
                <th className="py-3.5 px-3.5 font-bold">Account Status</th>
                <th className="py-3.5 px-3.5 font-bold">Registered</th>
                <th className="py-3.5 px-5 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700 text-base">No Team Members Found</p>
                      <p className="text-xs sm:text-[13px] text-slate-400 mt-1 max-w-sm font-medium">
                        No employees match your active filter criteria in your assigned departments.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const deptNames = getDepartmentNames(emp.assignedDepartments);
                  const isManagerRole = emp.role === 'manager';

                  return (
                    <tr key={emp.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={emp.fullName}
                            size="md"
                            className="w-9 h-9 border border-slate-200 flex-shrink-0 shadow-2xs"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center gap-2 truncate">
                              {emp.fullName}
                              {isManagerRole && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                                  MANAGER
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-600">
                        @{emp.username}
                      </td>

                      {/* Assigned Departments */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {deptNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5">
                        <Badge status={emp.status} dot size="md" />
                      </td>

                      {/* Registered */}
                      <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-500 font-medium">
                        {emp.createdAt}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setViewEmployee(emp)}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <EmployeeDetailModal
        employee={viewEmployee}
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        departments={departments}
      />
    </div>
  );
};
