import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Employee, EmployeeMonthlyActivityData } from '../../types';
import { api } from '../../lib/api';
import {
  Download,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  FileText,
} from 'lucide-react';

interface MonthlyActivityExportModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const MonthlyActivityExportModal: React.FC<MonthlyActivityExportModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [activityData, setActivityData] = useState<EmployeeMonthlyActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Years option: currentYear - 2 to currentYear + 1
  const yearOptions = [
    now.getFullYear() - 2,
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ];

  const fetchPreview = async (empId: string, month: number, year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<EmployeeMonthlyActivityData>(
        `/employees/${empId}/monthly-activity`,
        { month, year }
      );
      setActivityData(data);
    } catch (err: any) {
      console.error('Failed to load employee monthly activity:', err);
      setError(err?.message || 'Failed to load employee monthly activity preview');
      setActivityData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employee?.id) {
      fetchPreview(employee.id, selectedMonth, selectedYear);
    } else {
      setActivityData(null);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, employee?.id, selectedMonth, selectedYear]);

  const handleExportExcel = async () => {
    if (!employee) return;
    setIsExporting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.downloadBlob(
        `/employees/${employee.id}/monthly-activity/export?month=${selectedMonth}&year=${selectedYear}`,
        `${employee.fullName.replace(/\s+/g, '_')}_Activity_${selectedMonth}_${selectedYear}.xlsx`
      );
      setSuccessMessage('Excel report downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err?.message || 'Failed to generate and download Excel export file');
    } finally {
      setIsExporting(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Activity & Attendance Export"
      subtitle={`Generate audit-ready Excel reports for ${employee.fullName} (@${employee.username})`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Month & Year Selection Bar */}
        <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-sm font-bold bg-white text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-sm font-bold bg-white text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Action Button */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              variant="primary"
              size="md"
              icon={<Download className="w-4 h-4" />}
              isLoading={isExporting}
              disabled={isLoading || isExporting}
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Export Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        {activityData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Days Worked</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {activityData.summary.totalDaysWorked}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Hours</span>
              <span className="text-xl font-black text-blue-700 font-mono mt-0.5 block">
                {activityData.summary.totalWorkingHours}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Completed Shifts</span>
              <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">
                {activityData.summary.completedShifts}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">In-Progress</span>
              <span className="text-xl font-black text-amber-600 font-mono mt-0.5 block">
                {activityData.summary.inProgressShifts}
              </span>
            </div>
          </div>
        )}

        {/* Preview Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Monthly Report Preview — {activityData?.monthName || ''} {selectedYear}
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {activityData?.records.length || 0} Records
            </span>
          </div>

          <div className="overflow-x-auto max-h-[340px] scrollbar-thin">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading monthly activity records...
              </div>
            ) : !activityData || activityData.records.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Activity Records Found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  No attendance or task activity was recorded for {employee.fullName} in this month.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Work Date</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-2.5 text-center">JOIN Time</th>
                    <th className="py-2.5 px-2.5 text-center">END Time</th>
                    <th className="py-2.5 px-2.5 text-center">Duration</th>
                    <th className="py-2.5 px-3">Project Name</th>
                    <th className="py-2.5 px-3">Daily Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activityData.records.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.workDate}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {row.departmentName}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-600 whitespace-nowrap">
                        {row.joinTime}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono whitespace-nowrap">
                        {row.endTime === 'In Progress' ? (
                          <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-slate-600">{row.endTime}</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold text-slate-900 font-mono whitespace-nowrap">
                        {row.workingHours}
                      </td>
                      <td className="py-2 px-3 text-slate-800 max-w-[140px] truncate" title={row.projectName}>
                        {row.projectName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate" title={row.dailyNotes}>
                        {row.dailyNotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <p className="text-[11px] text-slate-400 text-center italic">
          * Exported Excel sheet includes all 9 standard organization columns: Employee Name, Department, Work Date, JOIN Time, END Time, Working Hours, Daily Notes, Project Name, and Project Details.
        </p>
      </div>
    </Modal>
  );
};
