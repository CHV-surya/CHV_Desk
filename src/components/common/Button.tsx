import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[13px] sm:text-sm px-3 py-1.5 rounded-lg gap-1.5 font-semibold h-8',
    md: 'text-sm px-3.5 py-2 rounded-xl gap-2 font-semibold h-9.5',
    lg: 'text-base px-4.5 py-2.5 rounded-xl gap-2.5 font-bold h-11',
  }[size];

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-600 active:bg-blue-800 focus:ring-2 focus:ring-blue-500/20',
    secondary:
      'bg-purple-600 hover:bg-purple-700 text-white shadow-xs border border-purple-600 active:bg-purple-800 focus:ring-2 focus:ring-purple-500/20',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-600 active:bg-rose-800 focus:ring-2 focus:ring-rose-500/20',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border border-emerald-600 active:bg-emerald-800 focus:ring-2 focus:ring-emerald-500/20',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs active:bg-slate-100 focus:ring-2 focus:ring-slate-400/20',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-2 focus:ring-slate-400/20',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-xs border border-slate-900 active:bg-slate-950 focus:ring-2 focus:ring-slate-500/20',
  }[variant];

  const disabledClasses =
    disabled || isLoading
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : 'cursor-pointer transition-all duration-150 active:scale-[0.99]';

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none outline-none font-sans ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
};
