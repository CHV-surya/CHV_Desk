import React, { useState } from 'react';
import { Eye, Edit2, Trash2, Users } from 'lucide-react';
import { Employee, Department } from '../../types';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { EditEmployeeModal } from './EditEmployeeModal';

interface EmployeeTableProps {
  employees: Employee[];
  departments: Department[];
  onUpdateEmployee: (
    id: string,
    updates: Partial<Employee>
  ) => { success: boolean; message?: string } | Promise<{ success: boolean; message?: string }>;
  onDeleteEmployee: (id: string) => void | Promise<void>;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  departments,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Employee | null>(null);

  const getDepartmentNames = (deptIds: string[]) => {
    return deptIds
      .map((id) => departments.find((d) => d.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold">Employee</th>
              <th className="py-3.5 px-3.5 font-bold">Username</th>
              <th className="py-3.5 px-3.5 font-bold">Assigned Departments</th>
              <th className="py-3.5 px-3.5 font-bold">Account Status</th>
              <th className="py-3.5 px-3.5 font-bold">Created Date</th>
              <th className="py-3.5 px-5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700 text-base">No Employee Accounts Found</p>
                    <p className="text-xs sm:text-[13px] text-slate-400 mt-1 max-w-sm font-medium">
                      No employees match your search or filters. Use the &quot;Add Employee&quot; button above to create a team member account.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const deptNames = getDepartmentNames(emp.assignedDepartments);
                const isSuperAdmin = emp.role === 'admin';

                return (
                  <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Employee Name */}
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
                            {isSuperAdmin && (
                              <span className="text-xs font-mono bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-[13px] text-slate-400 truncate mt-0.5">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-600">
                      @{emp.username}
                    </td>

                    {/* Assigned Departments (Multiple Badges) */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {deptNames.length > 0 ? (
                          deptNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-3.5">
                      <Badge status={emp.status} dot size="md" />
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-3.5 font-mono text-xs sm:text-[13px] text-slate-500 font-medium">
                      {emp.createdAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewEmployee(emp)}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditEmployee(emp)}
                          title="Edit Employee"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isSuperAdmin && (
                          <button
                            onClick={() => setDeleteCandidate(emp)}
                            title="Delete Employee"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal */}
      <EmployeeDetailModal
        employee={viewEmployee}
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        departments={departments}
      />

      {/* Edit Modal */}
      <EditEmployeeModal
        employee={editEmployee}
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        departments={departments}
        onUpdate={onUpdateEmployee}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteEmployee(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Employee Account"
        message={`Are you sure you want to remove "${deleteCandidate?.fullName}" (@${deleteCandidate?.username})? This action cannot be undone.`}
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
};
