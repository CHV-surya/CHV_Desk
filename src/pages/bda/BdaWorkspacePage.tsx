import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase,
  Users,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import type {
  BdaCustomer,
  BdaSummary,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../../types/bda';
import { BdaOverviewCards } from '../../components/bda/BdaOverviewCards';
import { BdaExcelToolbar } from '../../components/bda/BdaExcelToolbar';
import { CustomerTable } from '../../components/bda/CustomerTable';
import { CustomerFormModal } from '../../components/bda/CustomerFormModal';
import { CustomerDetailsModal } from '../../components/bda/CustomerDetailsModal';
import { BdaImportModal } from '../../components/bda/BdaImportModal';

export const BdaWorkspacePage: React.FC = () => {
  const { currentUser, isAdmin, isManager } = useAuth();
  const { refreshData: refreshDataContext } = useData();

  // State
  const [summary, setSummary] = useState<BdaSummary | null>(null);
  const [customers, setCustomers] = useState<BdaCustomer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<BdaCustomer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<BdaCustomer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<BdaCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / feedback message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, projectFilter, leadSourceFilter]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const data = await api.get<BdaSummary>('/bda/summary');
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load BDA summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      const res = await api.get<{ items: BdaCustomer[]; pagination: any }>('/bda/customers', {
        search: debouncedSearch,
        status: statusFilter,
        projectId: projectFilter,
        leadSource: leadSourceFilter,
        page,
        limit,
      });

      setCustomers(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      showToast('error', err.message || 'Failed to load customer directory');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [debouncedSearch, statusFilter, projectFilter, leadSourceFilter, page, limit]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Checkbox selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (customers.length === 0) return;
    const allSelectedOnPage = customers.every((c) => selectedIds.includes(c.id));
    if (allSelectedOnPage) {
      const pageIds = new Set(customers.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = customers.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Permission helpers
  const canEdit = (customer: BdaCustomer) => {
    if (isAdmin || isManager) return true;
    return customer.createdBy === currentUser?.id;
  };

  const canDelete = (customer: BdaCustomer) => {
    if (isAdmin || isManager) return true;
    return customer.createdBy === currentUser?.id;
  };

  // CRUD Handlers
  const handleCreateCustomer = async (data: CreateCustomerPayload) => {
    await api.post('/bda/customers', data);
    showToast('success', 'Customer enquiry registered successfully');
    fetchSummary();
    fetchCustomers();
    refreshDataContext();
  };

  const handleUpdateCustomer = async (data: UpdateCustomerPayload) => {
    if (!editingCustomer) return;
    await api.patch(`/bda/customers/${editingCustomer.id}`, data);
    showToast('success', 'Customer record updated successfully');
    setEditingCustomer(null);
    fetchSummary();
    fetchCustomers();
    refreshDataContext();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      await api.delete(`/bda/customers/${deletingCustomer.id}`);
      showToast('success', 'Customer record deleted');
      setDeletingCustomer(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingCustomer.id));
      fetchSummary();
      fetchCustomers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete customer record');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export handlers
  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      await api.downloadBlob('/bda/export', 'BDA_Customers_All.xlsx');
      showToast('success', 'Exported all customer records');
    } catch (err: any) {
      showToast('error', err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFiltered = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (projectFilter !== 'all') params.append('projectId', projectFilter);
      if (leadSourceFilter !== 'all') params.append('leadSource', leadSourceFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      await api.downloadBlob(`/bda/export${qs}`, 'BDA_Customers_Filtered.xlsx');
      showToast('success', 'Exported filtered customer list');
    } catch (err: any) {
      showToast('error', err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsExporting(true);
      await api.postDownloadBlob(
        '/bda/export',
        { customerIds: selectedIds },
        `BDA_Customers_Selected_${selectedIds.length}.xlsx`
      );
      showToast('success', `Exported ${selectedIds.length} selected records`);
    } catch (err: any) {
      showToast('error', err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              BDA Customer & Project Workspace
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
              {pagination.totalCount} Enquiries
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Business Development CRM, customer enquiry management, cross-department project linking, and offline Excel synchronization
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchSummary();
            fetchCustomers();
          }}
          disabled={isLoadingCustomers}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <BdaOverviewCards
        summary={summary}
        activeStatusFilter={statusFilter}
        onSelectStatus={(st) => setStatusFilter(st)}
        isLoading={isLoadingSummary}
      />

      {/* Toolbar & Filters */}
      <BdaExcelToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        leadSourceFilter={leadSourceFilter}
        onLeadSourceFilterChange={setLeadSourceFilter}
        selectedCount={selectedIds.length}
        onExportAll={handleExportAll}
        onExportFiltered={handleExportFiltered}
        onExportSelected={handleExportSelected}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAddCustomer={() => setIsAddModalOpen(true)}
        isExporting={isExporting}
      />

      {/* Customers Data Table */}
      <CustomerTable
        customers={customers}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onViewCustomer={setViewingCustomer}
        onEditCustomer={setEditingCustomer}
        onDeleteCustomer={setDeletingCustomer}
        onAddNew={() => setIsAddModalOpen(true)}
        isLoading={isLoadingCustomers}
        pagination={pagination}
        onPageChange={setPage}
        canEditCustomer={canEdit}
        canDeleteCustomer={canDelete}
      />

      {/* Modals */}
      {/* Add Customer Modal */}
      <CustomerFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateCustomer}
        title="Register New Customer Enquiry"
      />

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleUpdateCustomer}
        initialData={editingCustomer}
        title="Edit Customer Enquiry"
      />

      {/* View Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
        onEdit={(cust) => setEditingCustomer(cust)}
        canEdit={viewingCustomer ? canEdit(viewingCustomer) : false}
      />

      {/* Excel Import Modal */}
      <BdaImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchSummary();
          fetchCustomers();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Customer Record?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the enquiry record for{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                &ldquo;{deletingCustomer.customerName}&rdquo;
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
