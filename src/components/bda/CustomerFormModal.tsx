import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { ProjectSearchDropdown } from './ProjectSearchDropdown';
import { BDA_STATUSES, type BdaCustomer, type BdaStatus } from '../../types/bda';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: BdaCustomer | null;
  title?: string;
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

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const isEditing = !!initialData;
  const todayStr = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [requiredSoftware, setRequiredSoftware] = useState('');
  const [requirements, setRequirements] = useState('');
  const [leadSource, setLeadSource] = useState('Website');
  const [enquiryDate, setEnquiryDate] = useState(todayStr);
  const [followUpStatus, setFollowUpStatus] = useState<BdaStatus>('New');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || '');
      setCompanyName(initialData.companyName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setLocation(initialData.location || '');
      setProjectId(initialData.projectId || null);
      setRequiredSoftware(initialData.requiredSoftware || '');
      setRequirements(initialData.requirements || '');
      setLeadSource(initialData.leadSource || 'Website');
      setEnquiryDate(initialData.enquiryDate || todayStr);
      setFollowUpStatus(initialData.followUpStatus || 'New');
      setNextFollowUpDate(initialData.nextFollowUpDate || '');
      setRemarks(initialData.remarks || '');
    } else {
      setCustomerName('');
      setCompanyName('');
      setPhoneNumber('');
      setEmail('');
      setLocation('');
      setProjectId(null);
      setRequiredSoftware('');
      setRequirements('');
      setLeadSource('Website');
      setEnquiryDate(todayStr);
      setFollowUpStatus('New');
      setNextFollowUpDate('');
      setRemarks('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
    if (!requiredSoftware.trim()) errs.requiredSoftware = 'Required software or service is required';
    if (!enquiryDate) errs.enquiryDate = 'Enquiry date is required';
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        customerName: customerName.trim(),
        companyName: companyName.trim() || null,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || null,
        location: location.trim() || null,
        projectId: projectId || null,
        requiredSoftware: requiredSoftware.trim(),
        requirements: requirements.trim() || null,
        leadSource: leadSource.trim() || null,
        enquiryDate,
        followUpStatus,
        nextFollowUpDate: nextFollowUpDate || null,
        remarks: remarks.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save customer record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#0F2A4A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {title || (isEditing ? 'Edit Customer Enquiry' : 'Register New Customer Enquiry')}
              </h2>
              <p className="text-xs text-blue-200/80">
                {isEditing
                  ? 'Update customer requirements and follow-up progress'
                  : 'Capture prospective client enquiries and link to organization projects'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {errors.form && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
              {errors.form}
            </div>
          )}

          {/* Section: Customer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.customerName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Retail Solutions"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.phoneNumber
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Visakhapatnam, AP"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Project & Requirements */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Project & Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Project (Any Department)
                </label>
                <ProjectSearchDropdown
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Link to an active project..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Source
                </label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {LEAD_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Required Software / Service <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={requiredSoftware}
                onChange={(e) => setRequiredSoftware(e.target.value)}
                placeholder="e.g. E-Commerce Website, CRM Application, Mobile App, SEO Campaign..."
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.requiredSoftware
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                }`}
              />
              {errors.requiredSoftware && (
                <p className="mt-1 text-xs text-red-500">{errors.requiredSoftware}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Client Requirements / Scope Notes
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
                placeholder="Detailed customer specifications, desired tech stack, deliverable timeline..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Section: Follow-up & Dates */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Follow-up & Progression
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enquiry Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={enquiryDate}
                    onChange={(e) => setEnquiryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-up Status
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as BdaStatus)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {BDA_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Follow-up Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Latest Follow-up Discussion Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Key points from the call/meeting, client objections, next steps..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
