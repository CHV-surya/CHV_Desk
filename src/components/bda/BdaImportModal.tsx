import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { ImportSummary } from '../../types/bda';

interface BdaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BdaImportModal: React.FC<BdaImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [detailsFilter, setDetailsFilter] = useState<'all' | 'updated' | 'unchanged' | 'failed'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls') &&
        !file.type.includes('spreadsheet')
      ) {
        setErrorMessage('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
      setImportSummary(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setErrorMessage('Please drop an Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
      setImportSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage('');

      // Read file as base64 string
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(selectedFile);
      const fileBase64 = await base64Promise;

      const response = await api.post<{ data: ImportSummary } | ImportSummary>('/bda/import', {
        fileBase64,
      });

      const summaryData = (response as any).data || response;
      setImportSummary(summaryData);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to process Excel file. Please ensure it follows the export format.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setImportSummary(null);
    setErrorMessage('');
    onClose();
  };

  const filteredDetails = importSummary?.details.filter((d) => {
    if (detailsFilter === 'all') return true;
    return d.status === detailsFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#0F2A4A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15">
              <UploadCloud className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Import & Synchronize Customer Excel
              </h2>
              <p className="text-xs text-blue-200/80">
                Update customer records, follow-up statuses, and remarks offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetModal}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {!importSummary ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drop another to replace
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-2">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      Click to choose an Excel file, or drag and drop here
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Supports Microsoft Excel (.xlsx, .xls) files exported from WorkTrack
                    </span>
                  </div>
                )}
              </div>

              {/* Informational Guidance */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  Offline Sync Rules:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Record ID:</strong> Must not be altered. It matches rows to their database records.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Editable Fields:</strong> Phone Number, Email, Location, Required Software, Lead Source, Follow-up Status, Next Follow-up Date, Remarks.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Follow-up Statuses:</strong> Must match: New, Pending, Interested, Quotation Sent, Call Back Requested, In Discussion, Converted, Not Interested.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">No Duplication:</strong> Re-uploading an export will never duplicate customer records.
                  </li>
                </ul>
              </div>
            </>
          ) : (
            /* Import Summary Report */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    Synchronization Complete
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImportSummary(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Import Another File
                </button>
              </div>

              {/* Metric Counts */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {importSummary.totalRows}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Updated</span>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {importSummary.updatedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center border border-blue-200 dark:border-blue-900">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Unchanged</span>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                    {importSummary.unchangedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-center border border-red-200 dark:border-red-900">
                  <span className="text-[10px] uppercase font-bold text-red-600">Failed</span>
                  <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-0.5">
                    {importSummary.failedCount}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                {(['all', 'updated', 'unchanged', 'failed'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDetailsFilter(tab)}
                    className={`flex-1 py-1.5 px-2 rounded-lg capitalize transition-colors ${
                      detailsFilter === tab
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Row Log Details */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredDetails && filteredDetails.length > 0 ? (
                  filteredDetails.map((detail, idx) => {
                    const badgeClass =
                      detail.status === 'updated'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : detail.status === 'unchanged'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${badgeClass}`}
                          >
                            Row {detail.rowNumber}
                          </span>
                          <div>
                            {detail.customerName && (
                              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                                {detail.customerName}:
                              </span>
                            )}
                            <span className="text-slate-600 dark:text-slate-300">
                              {detail.message}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No rows matching &ldquo;{detailsFilter}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={resetModal}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {importSummary ? 'Done' : 'Cancel'}
          </button>
          {!importSummary && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Sync with Database
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
