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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Interested':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Quotation Sent':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Call Back Requested':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'In Discussion':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Not Interested':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#0F2A4A] text-white">
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
          <tbody className="divide-y divide-slate-100">
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
                    <div className="p-3 bg-blue-50 text-[#2563EB] rounded-2xl mb-3">
                      <FolderKanban className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-[#0F172A] text-base">
                      No Customer Enquiries Found
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 mb-4">
                      Get started by registering a prospective customer enquiry or clear your active filters.
                    </p>
                    <button
                      type="button"
                      onClick={onAddNew}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
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
                    className={`transition-colors hover:bg-blue-50/50 ${
                      isSelected
                        ? 'bg-blue-50/60'
                        : isEven
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(c.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Customer & Company */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0F172A] text-xs hover:text-[#2563EB] cursor-pointer transition-colors" onClick={() => onViewCustomer(c)}>
                        {c.customerName}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate max-w-[180px]">
                        {c.companyName || <span className="italic text-slate-400">Individual</span>}
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-[#0F172A]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{c.phoneNumber}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] truncate max-w-[180px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Required Software */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-medium text-[#0F172A] truncate" title={c.requiredSoftware}>
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
                          <span className="font-semibold text-[#0F172A] truncate max-w-[160px]">
                            {c.projectName}
                          </span>
                          {c.projectDepartmentName && (
                            <span className="text-[10px] font-semibold text-[#64748B]">
                              {c.projectDepartmentName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Enquiry Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
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
                        <span className="font-semibold text-amber-700">
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
                          className="p-1.5 rounded-md text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                          title="View customer profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEditCustomer(c) && (
                          <button
                            type="button"
                            onClick={() => onEditCustomer(c)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit customer record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteCustomer(c) && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-slate-50/70 text-xs text-[#64748B]">
        <div>
          Showing{' '}
          <strong className="text-[#0F172A]">
            {customers.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-[#0F172A]">
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
          </strong>{' '}
          of <strong className="text-[#0F172A]">{pagination.totalCount}</strong>{' '}
          {pagination.totalCount === 1 ? 'enquiry' : 'enquiries'}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-semibold text-[#0F172A]">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
