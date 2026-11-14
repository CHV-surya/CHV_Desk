import React from 'react';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Clock,
  Edit2,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import type { BdaCustomer } from '../../types/bda';

interface CustomerDetailsModalProps {
  customer: BdaCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: BdaCustomer) => void;
  canEdit?: boolean;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
  canEdit = true,
}) => {
  if (!isOpen || !customer) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Interested':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Quotation Sent':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
      case 'Call Back Requested':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'In Discussion':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'Not Interested':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const cleanPhone = customer.phoneNumber.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#0F2A4A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-white text-lg">
              {customer.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  {customer.customerName}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    customer.followUpStatus
                  )}`}
                >
                  {customer.followUpStatus}
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                {customer.companyName || 'Individual Customer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/15"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Record
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Quick Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  <a
                    href={`tel:${customer.phoneNumber}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {customer.phoneNumber}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {customer.email}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {customer.location || <span className="text-slate-400">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Project & Service Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Service & Project Association
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Associated Project</span>
                <div className="flex items-center gap-2 mt-1">
                  {customer.projectName ? (
                    <>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {customer.projectName}
                      </span>
                      {customer.projectDepartmentName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {customer.projectDepartmentName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No project linked</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Lead Source</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                  {customer.leadSource || 'Direct / Unknown'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs text-slate-400 font-medium">Required Software / Service</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm mt-1">
                {customer.requiredSoftware}
              </p>
            </div>

            {customer.requirements && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Detailed Scope & Requirements</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                  {customer.requirements}
                </p>
              </div>
            )}
          </div>

          {/* Follow-up Progression */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Follow-up & Progression Timeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Enquiry Registered Date</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {customer.enquiryDate}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Next Scheduled Follow-up</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {customer.nextFollowUpDate || 'None Scheduled'}
                  </span>
                </div>
              </div>
            </div>

            {customer.remarks && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400 font-medium">Remarks / Discussion Notes</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                  {customer.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Audit Attribution Footer */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              <span>Created by: </span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {customer.creatorName || customer.creatorUsername || 'System'}
              </strong>
              <span> on {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
            {customer.updatedAt && (
              <div>
                <span>Last updated: </span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {customer.updaterName || customer.updaterUsername || 'System'}
                </strong>
                <span> on {new Date(customer.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <span className="text-[11px] font-mono text-slate-400">
            ID: {customer.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
