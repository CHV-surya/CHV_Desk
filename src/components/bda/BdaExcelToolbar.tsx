import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ChevronDown,
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { BDA_STATUSES, type BdaStatus } from '../../types/bda';
import { useData } from '../../context/DataContext';

interface BdaExcelToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  projectFilter: string;
  onProjectFilterChange: (projectId: string) => void;
  leadSourceFilter: string;
  onLeadSourceFilterChange: (source: string) => void;
  selectedCount: number;
  onExportAll: () => void;
  onExportFiltered: () => void;
  onExportSelected: () => void;
  onOpenImport: () => void;
  onOpenAddCustomer: () => void;
  isExporting?: boolean;
}

const LEAD_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Cold Call',
  'Exhibition / Expo',
  'Instagram',
  'WhatsApp',
  'Direct Walk-in',
  'Other',
];

export const BdaExcelToolbar: React.FC<BdaExcelToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  projectFilter,
  onProjectFilterChange,
  leadSourceFilter,
  onLeadSourceFilterChange,
  selectedCount,
  onExportAll,
  onExportFiltered,
  onExportSelected,
  onOpenImport,
  onOpenAddCustomer,
  isExporting = false,
}) => {
  const { projects } = useData();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const hasActiveFilters =
    statusFilter !== 'all' || projectFilter !== 'all' || leadSourceFilter !== 'all' || search !== '';

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onProjectFilterChange('all');
    onLeadSourceFilterChange('all');
  };

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      {/* Top Bar: Search and Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, company, phone, email, software..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] shadow-2xs transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] shadow-2xs transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-xl py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportAll();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-[#0F172A] hover:bg-slate-50 text-left font-medium"
                >
                  <span>Export All Customers</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportFiltered();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-[#0F172A] hover:bg-slate-50 text-left font-medium"
                >
                  <span>Export Filtered List</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportSelected();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left font-medium ${
                    selectedCount > 0
                      ? 'text-[#0F172A] hover:bg-slate-50'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Export Selected ({selectedCount})</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] shadow-2xs transition-all"
          >
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>Import Excel</span>
          </button>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 text-[#64748B] font-semibold uppercase tracking-wider text-[11px] mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="all">All Follow-up Statuses</option>
          {BDA_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Project Dropdown */}
        <select
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] max-w-xs truncate"
        >
          <option value="all">All Projects</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Lead Source Dropdown */}
        <select
          value={leadSourceFilter}
          onChange={(e) => onLeadSourceFilterChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="all">All Lead Sources</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
