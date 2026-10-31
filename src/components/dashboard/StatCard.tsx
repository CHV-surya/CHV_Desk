import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  indicator?: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  indicator,
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
      accent: 'text-blue-600',
      pill: 'bg-blue-50 text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
      accent: 'text-purple-600',
      pill: 'bg-purple-50 text-purple-700',
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      accent: 'text-emerald-600',
      pill: 'bg-emerald-50 text-emerald-700',
    },
    orange: {
      bg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      accent: 'text-amber-600',
      pill: 'bg-amber-50 text-amber-700',
    },
    red: {
      bg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      accent: 'text-rose-600',
      pill: 'bg-rose-50 text-rose-700',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-600 border border-slate-200/60',
      accent: 'text-slate-600',
      pill: 'bg-slate-100 text-slate-700',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${colorStyles.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-3xl sm:text-[34px] font-extrabold font-mono tracking-tight text-slate-900">
          {value}
        </span>
        {indicator}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs sm:text-[13px] text-slate-400">
          <span className="truncate font-medium">{subtitle}</span>
          {trend && (
            <span
              className={`font-semibold ml-1.5 flex-shrink-0 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
