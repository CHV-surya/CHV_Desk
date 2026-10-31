import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  FolderKanban,
  Users,
  Calendar,
  CheckCircle2,
  Trash2,
  Clock,
  RefreshCw,
  Play,
  Database,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';

export const RetentionPolicy: React.FC = () => {
  const [retentionStatus, setRetentionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/admin/retention/status');
      setRetentionStatus(res.status);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunCleanup = async () => {
    if (!window.confirm('Run database retention cleanup now? Older daily activities outside the 7-day retention window will be deleted. Projects and employee accounts are permanent and will not be touched.')) {
      return;
    }
    setIsExecuting(true);
    try {
      const res = await api.post<any>('/admin/retention/run', {});
      setActionMessage(res.message || 'Retention cleanup completed successfully.');
      await fetchStatus();
    } catch (err: any) {
      setActionMessage(err?.message || 'Failed to execute retention cleanup.');
    } finally {
      setIsExecuting(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Monthly Data Retention Architecture
            </h1>
            <Badge variant="blue" size="md">
              Live Database Connected
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Automated 7-day rolling window preservation for activities and permanent preservation for projects
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            isLoading={isLoading}
            onClick={fetchStatus}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Status
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={isExecuting}
            onClick={handleRunCleanup}
            icon={<Play className="w-4 h-4" />}
          >
            Run Retention Now
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Live Neon Status Banner */}
      {retentionStatus && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md border border-blue-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Neon PostgreSQL Retention State</h3>
                <p className="text-xs text-blue-200/80 font-mono mt-0.5">
                  Current Date: {retentionStatus.currentDate} (Asia/Kolkata) • Cutoff Date: {retentionStatus.cutoffDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                <span className="text-blue-200 block text-[11px]">Records Eligible for Purge:</span>
                <span className="text-base font-bold text-emerald-400">{retentionStatus.recordsEligibleForDeletion} records</span>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                <span className="text-blue-200 block text-[11px]">Preserved Window:</span>
                <span className="text-xs font-bold text-white">{retentionStatus.retainedPeriod}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Rules Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rule 1 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center gap-2.5 text-blue-600 mb-3">
            <Clock className="w-5 h-5" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-900">
              Current Month Retention
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            All daily employee activity logs, JOIN/END timestamps, and notes are actively retained for the duration of the current calendar month.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center gap-2.5 text-purple-600 mb-3">
            <History className="w-5 h-5" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-900">
              7-Day Rollover Preservation
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Upon transitioning to a new calendar month, the final 7 days of the previous month remain preserved to guarantee reporting continuity.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 border-emerald-300/60 bg-emerald-50/20">
          <div className="flex items-center gap-2.5 text-emerald-700 mb-3">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-900">
              Immutable Core Records
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            <strong>Projects</strong> and <strong>Employee Accounts</strong> are permanent assets and are <em>never</em> deleted during monthly cleanup.
          </p>
        </div>
      </div>

      {/* Concrete Example Visualizer */}
      <div className="glass-card rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
              Monthly Transition Simulation (e.g. November 1 Boundary)
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
              Simulated demonstration of automated database maintenance
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            Backend Cron Target
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Removed */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
            <div className="flex items-center justify-between text-rose-800 font-bold text-xs uppercase mb-2">
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Purged / Archived
              </span>
              <Badge variant="danger" size="sm">
                Removed
              </Badge>
            </div>
            <p className="text-sm font-bold text-slate-800">October 1 – 24 Records</p>
            <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed font-medium">
              Older activity logs outside the 7-day retention threshold are pruned to maintain high query performance.
            </p>
          </div>

          {/* Box 2: Preserved */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 font-bold text-xs uppercase mb-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Rollover Window
              </span>
              <Badge variant="success" size="sm">
                Preserved
              </Badge>
            </div>
            <p className="text-sm font-bold text-slate-800">October 25 – 31 Records</p>
            <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed font-medium">
              Final 7 days of previous month remain queryable for payroll reconciliation and sprint wrap-ups.
            </p>
          </div>

          {/* Box 3: Active Month */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 shadow-2xs">
            <div className="flex items-center justify-between text-blue-800 font-bold text-xs uppercase mb-2">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Active Recording
              </span>
              <Badge variant="blue" size="sm">
                Live Data
              </Badge>
            </div>
            <p className="text-sm font-bold text-slate-800">November 1 – 30 Records</p>
            <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed font-medium">
              New current month tracking begins seamlessly with fresh daily check-ins and notes.
            </p>
          </div>
        </div>
      </div>

      {/* Entity Classification Matrix */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-200/70 bg-slate-50/60">
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
            Entity Classification Matrix
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-medium">
            Rules governing lifespan and administrative privileges per record type
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <th className="py-3.5 px-6 font-bold">Entity Type</th>
                <th className="py-3.5 px-4 font-bold">Retention Policy</th>
                <th className="py-3.5 px-4 font-bold">Deletion Trigger</th>
                <th className="py-3.5 px-6 font-bold">Access Privilege</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  Projects
                </td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold text-sm">
                  Permanent — Never Auto-Deleted
                </td>
                <td className="py-3.5 px-4 text-xs sm:text-[13px] text-slate-500 font-medium">Exempt from monthly purge</td>
                <td className="py-3.5 px-6 text-sm text-slate-700 font-semibold">
                  Admin Only
                </td>
              </tr>

              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  Employee Accounts
                </td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold text-sm">
                  Permanent — Never Auto-Deleted
                </td>
                <td className="py-3.5 px-4 text-xs sm:text-[13px] text-slate-500 font-medium">Exempt from monthly purge</td>
                <td className="py-3.5 px-6 text-sm text-slate-700 font-semibold">
                  Admin Only
                </td>
              </tr>

              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  Daily Activity Logs
                </td>
                <td className="py-3.5 px-4 text-amber-700 font-bold text-sm">
                  Current Month + 7 Days Rolling
                </td>
                <td className="py-3.5 px-4 text-xs sm:text-[13px] text-slate-500 font-medium">Monthly Cron on 1st of month</td>
                <td className="py-3.5 px-6 text-sm text-slate-700 font-semibold">
                  Automated by Backend
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
