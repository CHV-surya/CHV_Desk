import React from 'react';
import {
  Users,
  Sparkles,
  Clock,
  HeartHandshake,
  FileSpreadsheet,
  CheckCircle2,
  PhoneCall,
  XCircle,
} from 'lucide-react';
import type { BdaSummary } from '../../types/bda';

interface BdaOverviewCardsProps {
  summary: BdaSummary | null;
  activeStatusFilter: string;
  onSelectStatus: (status: string) => void;
  isLoading?: boolean;
}

export const BdaOverviewCards: React.FC<BdaOverviewCardsProps> = ({
  summary,
  activeStatusFilter,
  onSelectStatus,
  isLoading = false,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Customers',
      count: summary?.total ?? 0,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900/40',
      activeRing: 'ring-2 ring-blue-500 shadow-md',
    },
    {
      id: 'New',
      title: 'New Enquiries',
      count: summary?.newEnquiries ?? 0,
      icon: Sparkles,
      color: 'indigo',
      bgColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-900/40',
      activeRing: 'ring-2 ring-indigo-500 shadow-md',
    },
    {
      id: 'Pending',
      title: 'Pending Follow-ups',
      count: summary?.pendingFollowUps ?? 0,
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900/40',
      activeRing: 'ring-2 ring-amber-500 shadow-md',
    },
    {
      id: 'Interested',
      title: 'Interested',
      count: summary?.interested ?? 0,
      icon: HeartHandshake,
      color: 'purple',
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-900/40',
      activeRing: 'ring-2 ring-purple-500 shadow-md',
    },
    {
      id: 'Quotation Sent',
      title: 'Quotations Sent',
      count: summary?.quotationsSent ?? 0,
      icon: FileSpreadsheet,
      color: 'sky',
      bgColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      borderColor: 'border-sky-200 dark:border-sky-900/40',
      activeRing: 'ring-2 ring-sky-500 shadow-md',
    },
    {
      id: 'Converted',
      title: 'Converted',
      count: summary?.converted ?? 0,
      icon: CheckCircle2,
      color: 'emerald',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-900/40',
      activeRing: 'ring-2 ring-emerald-500 shadow-md',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeStatusFilter === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onSelectStatus(c.id)}
            className={`flex flex-col text-left p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all duration-150 hover:shadow-md cursor-pointer ${
              c.borderColor
            } ${isActive ? c.activeRing : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bgColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                  c.count.toLocaleString()
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
