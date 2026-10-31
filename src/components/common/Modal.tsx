import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  footer,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const widthClasses = {
    sm: 'max-w-[420px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[620px]',
    xl: 'max-w-[720px]',
    '2xl': 'max-w-[840px]',
  }[maxWidth];

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Full Viewport Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${widthClasses} max-h-[calc(100vh-40px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 z-10 my-auto`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.9) inset',
        }}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/90 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-none flex-shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Optional Fixed Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
