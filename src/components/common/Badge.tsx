import React from 'react';
import { ActivityStatus, AccountStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'status' | 'department' | 'role' | 'outline' | 'neutral' | 'danger' | 'warning' | 'success' | 'blue' | 'purple';
  status?: ActivityStatus | AccountStatus | 'active' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  status,
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-semibold tracking-normal',
    md: 'text-[13px] px-2.5 py-0.5 rounded-lg font-semibold tracking-normal',
    lg: 'text-sm px-3 py-1 rounded-lg font-bold tracking-normal',
  }[size];

  let colorClasses = 'bg-slate-100/90 text-slate-700 border border-slate-200';
  let dotColor = 'bg-slate-400';

  if (status) {
    switch (status) {
      case 'working':
        colorClasses = 'bg-blue-50 text-blue-700 border border-blue-200/80';
        dotColor = 'bg-blue-600 animate-pulse';
        break;
      case 'completed':
      case 'active':
        colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
        dotColor = 'bg-emerald-600';
        break;
      case 'not-joined':
        colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200/80';
        dotColor = 'bg-amber-500';
        break;
      case 'inactive':
        colorClasses = 'bg-rose-50 text-rose-700 border border-rose-200/80';
        dotColor = 'bg-rose-500';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
        dotColor = 'bg-emerald-600';
        break;
      case 'warning':
        colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200/80';
        dotColor = 'bg-amber-500';
        break;
      case 'danger':
        colorClasses = 'bg-rose-50 text-rose-700 border border-rose-200/80';
        dotColor = 'bg-rose-500';
        break;
      case 'blue':
        colorClasses = 'bg-blue-50 text-blue-700 border border-blue-200/80';
        dotColor = 'bg-blue-600';
        break;
      case 'purple':
        colorClasses = 'bg-purple-50 text-purple-700 border border-purple-200/80';
        dotColor = 'bg-purple-600';
        break;
      case 'outline':
        colorClasses = 'bg-transparent text-slate-600 border border-slate-200';
        dotColor = 'bg-slate-400';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-100 text-slate-700 border border-slate-200';
        dotColor = 'bg-slate-400';
        break;
    }
  }

  // Format label if status is given and no children
  let content = children;
  if (!content && status) {
    if (status === 'working') content = 'Working';
    else if (status === 'completed') content = 'Completed';
    else if (status === 'not-joined') content = 'Not Joined';
    else if (status === 'active') content = 'Active';
    else if (status === 'inactive') content = 'Inactive';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors select-none font-sans ${sizeClasses} ${colorClasses} ${className}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />}
      <span className="truncate">{content}</span>
    </span>
  );
};
