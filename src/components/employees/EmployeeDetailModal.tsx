import React, { useState } from 'react';
import { Mail, Calendar, Building2, Download, FileSpreadsheet } from 'lucide-react';
import { Employee, Department } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useData } from '../../context/DataContext';
import { MonthlyActivityExportModal } from './MonthlyActivityExportModal';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  isOpen,
  onClose,
  departments,
}) => {
  const { activities, projects } = useData();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (!employee) return null;

  const employeeDepts = departments.filter((d) =>
    employee.assignedDepartments?.includes(d.id)
  );

  const employeeActivities = activities.filter((a) => a.employeeId === employee.id);
  const employeeProjects = projects.filter((p) => p.createdBy === employee.id);
  const totalCompletedDays = employeeActivities.filter((a) => a.status === 'completed').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Account Details"
      subtitle={`System ID: ${employee.id}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="flex items-center gap-3.5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
          <Avatar
            name={employee.fullName}
            size="xl"
            className="w-12 h-12 rounded-xl text-base shadow-2xs"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-slate-900 truncate">{employee.fullName}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">@{employee.username}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge status={employee.status} dot size="md" />
              <Badge variant={employee.role === 'admin' ? 'purple' : employee.role === 'manager' ? 'purple' : 'blue'} size="md">
                {employee.role === 'admin' ? 'Admin' : employee.role === 'manager' ? 'Manager' : 'Employee'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-slate-400 text-xs uppercase font-bold block mb-1">
              Email
            </span>
            <span className="font-semibold text-slate-800 break-all">{employee.email}</span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-slate-400 text-xs uppercase font-bold block mb-1">
              Registered
            </span>
            <span className="font-semibold text-slate-800 font-mono">{employee.createdAt}</span>
          </div>
        </div>

        {/* Assigned Departments */}
        <div>
          <span className="text-slate-400 text-xs uppercase font-bold block mb-2">
            Assigned Departments ({employeeDepts.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {employeeDepts.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-[13px] font-semibold border shadow-2xs"
                style={{
                  backgroundColor: `${d.color}10`,
                  borderColor: `${d.color}30`,
                  color: d.color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Activity Stats */}
        <div className="grid grid-cols-3 gap-3 py-3 px-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-center">
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900">{employeeActivities.length}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">Activity Logs</p>
          </div>
          <div className="border-x border-slate-200">
            <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600">{totalCompletedDays}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">Shifts Ended</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono text-blue-600">{employeeProjects.length}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">Projects</p>
          </div>
        </div>

        {/* Export Monthly Activity Section */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full justify-center bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:border-emerald-400 font-bold shadow-2xs gap-2 py-2.5 rounded-xl cursor-pointer"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={() => setIsExportModalOpen(true)}
          >
            Export Monthly Activity (.xlsx)
          </Button>
        </div>
      </div>

      {/* Monthly Activity Export Modal */}
      <MonthlyActivityExportModal
        employee={employee}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </Modal>
  );
};
