import React from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
} from 'lucide-react';
import type { BdaCustomer } from '../../types/bda';

interface CustomerTableProps {
  customers: BdaCustomer[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewCustomer: (customer: BdaCustomer) => void;
  onEditCustomer: (customer: BdaCustomer) => void;
  onDeleteCustomer: (customer: BdaCustomer) => void;
  onAddNew: () => void;
  isLoading?: boolean;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  canEditCustomer: (customer: BdaCustomer) => boolean;
  canDeleteCustomer: (customer: BdaCustomer) => boolean;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onAddNew,
  isLoading = false,
  pagination,
  onPageChange,
  canEditCustomer,
  canDeleteCustomer,
}) => {
  const allSelected =
    customers.length > 0 && customers.every((c) => selectedIds.includes(c.id));
  const someSelected =
    customers.some((c) => selectedIds.includes(c.id)) && !allSelected;

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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#0F2A4A] text-white">
              {/* Checkbox column */}
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Customer / Company
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Contact Info
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Required Software / Service
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Associated Project
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Enquiry Date
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Status
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">
                Next Follow-up
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading customer directory...</span>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl mb-3">
                      <FolderKanban className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      No Customer Enquiries Found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Get started by registering a prospective customer enquiry or clear your active filters.
                    </p>
                    <button
                      type="button"
                      onClick={onAddNew}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Register New Customer
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c, idx) => {
                const isSelected = selectedIds.includes(c.id);
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-900/20'
                        : isEven
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/40 dark:bg-slate-900/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(c.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Customer & Company */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-xs hover:text-blue-600 cursor-pointer" onClick={() => onViewCustomer(c)}>
                        {c.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {c.companyName || <span className="italic text-slate-400">Individual</span>}
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{c.phoneNumber}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[180px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Required Software */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={c.requiredSoftware}>
                        {c.requiredSoftware}
                      </div>
                      {c.location && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.location}</span>
                        </div>
                      )}
                    </td>

                    {/* Associated Project */}
                    <td className="py-3 px-3">
                      {c.projectName ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {c.projectName}
                          </span>
                          {c.projectDepartmentName && (
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {c.projectDepartmentName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Enquiry Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {c.enquiryDate}
                    </td>

                    {/* Follow-up Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          c.followUpStatus
                        )}`}
                      >
                        {c.followUpStatus}
                      </span>
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {c.nextFollowUpDate ? (
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {c.nextFollowUpDate}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewCustomer(c)}
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="View customer profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEditCustomer(c) && (
                          <button
                            type="button"
                            onClick={() => onEditCustomer(c)}
                            className="p-1 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Edit customer record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteCustomer(c) && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c)}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="Delete customer record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400">
        <div>
          Showing{' '}
          <strong className="text-slate-900 dark:text-white">
            {customers.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-900 dark:text-white">
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
          </strong>{' '}
          of <strong className="text-slate-900 dark:text-white">{pagination.totalCount}</strong>{' '}
          enquiries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-semibold">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
