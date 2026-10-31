import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  accentColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className = '',
  accentColor,
}) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  // Deterministic color palette matching WorkTrack SaaS design
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200/80',
    'bg-purple-100 text-purple-700 border-purple-200/80',
    'bg-emerald-100 text-emerald-700 border-emerald-200/80',
    'bg-amber-100 text-amber-700 border-amber-200/80',
    'bg-indigo-100 text-indigo-700 border-indigo-200/80',
    'bg-cyan-100 text-cyan-700 border-cyan-200/80',
    'bg-violet-100 text-violet-700 border-violet-200/80',
  ];

  const charCode = initial.charCodeAt(0) || 0;
  const colorClass = colors[charCode % colors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs font-bold',
    sm: 'w-7.5 h-7.5 text-xs font-bold',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-bold',
    lg: 'w-10 h-10 text-sm sm:text-base font-extrabold',
    xl: 'w-12 h-12 text-lg sm:text-xl font-extrabold',
  }[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none border shadow-2xs ${sizeClasses} ${colorClass} ${className}`}
      style={accentColor ? { backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` } : undefined}
      title={name}
      aria-label={name}
    >
      {initial}
    </div>
  );
};

