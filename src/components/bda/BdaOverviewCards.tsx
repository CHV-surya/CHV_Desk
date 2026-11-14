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
      bgColor: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
      activeRing: 'ring-2 ring-blue-500 shadow-md',
    },
    {
      id: 'New',
      title: 'New Enquiries',
      count: summary?.newEnquiries ?? 0,
      icon: Sparkles,
      bgColor: 'bg-indigo-50 text-indigo-600',
      borderColor: 'border-indigo-200',
      activeRing: 'ring-2 ring-indigo-500 shadow-md',
    },
    {
      id: 'Pending',
      title: 'Pending Follow-ups',
      count: summary?.pendingFollowUps ?? 0,
      icon: Clock,
      bgColor: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-200',
      activeRing: 'ring-2 ring-amber-500 shadow-md',
    },
    {
      id: 'Interested',
      title: 'Interested',
      count: summary?.interested ?? 0,
      icon: HeartHandshake,
      bgColor: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
      activeRing: 'ring-2 ring-purple-500 shadow-md',
    },
    {
      id: 'Quotation Sent',
      title: 'Quotations Sent',
      count: summary?.quotationsSent ?? 0,
      icon: FileSpreadsheet,
      bgColor: 'bg-sky-50 text-sky-600',
      borderColor: 'border-sky-200',
      activeRing: 'ring-2 ring-sky-500 shadow-md',
    },
    {
      id: 'Converted',
      title: 'Converted',
      count: summary?.converted ?? 0,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
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
            className={`flex flex-col text-left p-4 rounded-xl bg-white border shadow-sm transition-all duration-150 hover:shadow-md cursor-pointer h-full ${
              c.borderColor
            } ${isActive ? c.activeRing : 'hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bgColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse" />
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
