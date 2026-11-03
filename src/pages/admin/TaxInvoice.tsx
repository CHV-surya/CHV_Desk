import React, { useState, useCallback, useRef } from 'react';
import {
  Receipt,
  Upload,
  Plus,
  Trash2,
  Download,
  X,
  Building2,
  FileText,
  CreditCard,
  ScrollText,
  PenTool,
  Globe,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { generateInvoicePDF, InvoiceData, InvoiceService } from '../../lib/invoicePdfGenerator';

// ─── DEFAULT VALUES ───
const DEFAULT_COMPANY_NAME = 'CHVAPPS LLP';
const DEFAULT_TAGLINE = 'Your Vision, Our Innovation';
const DEFAULT_SELLER_GSTIN = '37AAUFC9629H1ZQ';
const DEFAULT_SIGNATORY = 'V. Chandra Krishna';

const DEFAULT_TERMS = [
  'This is a computer generated tax invoice.',
  'All amounts are in Indian Rupees (₹).',
  'Payment is to be made as per the terms agreed.',
  'This invoice is valid for the services mentioned above.',
];

const EMPTY_SERVICE: InvoiceService = {
  description: '',
  sac: '',
  qty: 1,
  rate: 0,
  amount: 0,
};

function todayString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatINR(num: number): string {
  if (isNaN(num) || num === 0) return '₹0.00';
  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);
  const formatted = remaining.length
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return `₹${formatted}.${decPart}`;
}

// ─── SECTION CARD COMPONENT ───
const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
      <span className="text-blue-600">{icon}</span>
      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── INPUT FIELD COMPONENT ───
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, required, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white transition-all placeholder:text-slate-400"
    />
  </div>
);

// ─── TEXTAREA FIELD COMPONENT ───
const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white transition-all resize-none placeholder:text-slate-400"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN TAX INVOICE PAGE
// ═══════════════════════════════════════════════════════════════
export const TaxInvoice: React.FC = () => {
  // ─── Company / Header State ───
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Seller / Invoice Details ───
  const [sellerName, setSellerName] = useState(DEFAULT_COMPANY_NAME);
  const [sellerGstin, setSellerGstin] = useState(DEFAULT_SELLER_GSTIN);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayString());
  const [authorizedSignatory, setAuthorizedSignatory] = useState(DEFAULT_SIGNATORY);

  // ─── Bill To ───
  const [customerName, setCustomerName] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // ─── Services ───
  const [services, setServices] = useState<InvoiceService[]>([{ ...EMPTY_SERVICE }]);

  // ─── Grand Total (manual) ───
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // ─── Payment ───
  const [paymentMode, setPaymentMode] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIALLY PAID' | 'UNPAID'>('PAID');

  // ─── Terms ───
  const [termsAndConditions, setTermsAndConditions] = useState<string[]>([...DEFAULT_TERMS]);

  // ─── Footer ───
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerWebsite, setFooterWebsite] = useState('');
  const [footerAddress, setFooterAddress] = useState('');

  // ─── Toast ───
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Logo Upload Handler ───
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Logo file must be under 5MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('error', 'Only PNG and JPEG logos are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result as string);
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeLogo = () => {
    setLogoBase64(null);
    setLogoFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Service Row Handlers ───
  const addServiceRow = () => {
    setServices((prev) => [...prev, { ...EMPTY_SERVICE }]);
  };

  const removeServiceRow = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof InvoiceService, value: string | number) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  // ─── Terms Handlers ───
  const addTerm = () => {
    setTermsAndConditions((prev) => [...prev, '']);
  };

  const removeTerm = (index: number) => {
    setTermsAndConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTerm = (index: number, value: string) => {
    setTermsAndConditions((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  // ─── Export PDF Handler ───
  const handleExportPDF = () => {
    // Validation
    if (!customerName.trim()) {
      showToast('error', 'Please enter the customer name');
      return;
    }
    if (services.filter((s) => s.description.trim()).length === 0) {
      showToast('error', 'Please add at least one service description');
      return;
    }

    const invoiceData: InvoiceData = {
      companyName,
      tagline,
      logoBase64,
      sellerName,
      sellerGstin,
      invoiceNumber,
      invoiceDate,
      authorizedSignatory,
      customerName,
      customerGstin,
      billingAddress,
      customerPhone,
      customerEmail,
      services,
      grandTotal,
      paymentMode,
      utrNumber,
      amountReceived,
      paymentStatus,
      termsAndConditions: termsAndConditions.filter((t) => t.trim()),
      footerPhone,
      footerEmail,
      footerWebsite,
      footerAddress,
    };

    try {
      generateInvoicePDF(invoiceData);
      showToast('success', 'Tax Invoice PDF generated successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('error', 'Failed to generate PDF. Please try again.');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50/70 pb-12">
      {/* ─── HEADER BANNER ─── */}
      <div className="bg-[#142653] px-6 py-5 border-b border-[#1e3a7a]/60 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white">
              <Receipt className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Tax Invoice Generator</h1>
                <span className="text-xs font-mono uppercase bg-blue-500/25 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md font-bold">
                  PDF TOOL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate professional, client-ready tax invoices formatted to A4 print standards
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all font-semibold px-5 py-2.5 rounded-xl border border-blue-400/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: FORM (7 COLS ON XL)                */}
          {/* ════════════════════════════════════════════════ */}
          <div className="xl:col-span-7 space-y-5">
            {/* ─── Company / Header Section ─── */}
            <SectionCard title="Company Header" icon={<Building2 className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="CHVAPPS LLP" />
                  <InputField label="Tagline" value={tagline} onChange={setTagline} placeholder="Your Vision, Our Innovation" />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Logo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoBase64 ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                      <img src={logoBase64} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1 border border-blue-200" />
                      <span className="text-sm font-medium text-slate-700 flex-1 truncate">{logoFileName}</span>
                      <button
                        onClick={removeLogo}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove Logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo (PNG/JPEG, max 5MB - Browser memory only)
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* ─── Invoice Details Section ─── */}
            <SectionCard title="Invoice Details" icon={<FileText className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Seller Name" value={sellerName} onChange={setSellerName} placeholder="CHVAPPS LLP" />
                  <InputField label="Seller GSTIN" value={sellerGstin} onChange={setSellerGstin} placeholder="37AAUFC9629H1ZQ" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField label="Invoice Number" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="CHV/2026/0628/001" required />
                  <InputField label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="DD/MM/YYYY" />
                  <InputField label="Authorized Signatory" value={authorizedSignatory} onChange={setAuthorizedSignatory} placeholder="V. Chandra Krishna" />
                </div>
              </div>
            </SectionCard>

            {/* ─── Bill To Section ─── */}
            <SectionCard title="Bill To (Customer Details)" icon={<Building2 className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="RAVIKIRAN BEVERAGES" required />
                  <InputField label="Customer GSTIN" value={customerGstin} onChange={setCustomerGstin} placeholder="37ABHFR4250P1ZM" />
                </div>
                <TextAreaField label="Billing Address" value={billingAddress} onChange={setBillingAddress} placeholder="Ranastalam, Srikakulam, Andhra Pradesh - 532407" rows={2} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Phone" value={customerPhone} onChange={setCustomerPhone} placeholder="+91 98765 43210" />
                  <InputField label="Email" value={customerEmail} onChange={setCustomerEmail} placeholder="billing@ravikiranbeverages.com" />
                </div>
              </div>
            </SectionCard>

            {/* ─── Services Table Section ─── */}
            <SectionCard title="Services / Line Items" icon={<ScrollText className="w-4 h-4" />}>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Item #{index + 1}
                      </span>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeServiceRow(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <InputField
                      label="Description of Services"
                      value={service.description}
                      onChange={(val) => updateService(index, 'description', val)}
                      placeholder="Website Design"
                      required
                    />
                    <div className="grid grid-cols-4 gap-3">
                      <InputField
                        label="SAC"
                        value={service.sac}
                        onChange={(val) => updateService(index, 'sac', val)}
                        placeholder="998314"
                      />
                      <InputField
                        label="Qty"
                        value={String(service.qty || '')}
                        onChange={(val) => updateService(index, 'qty', Number(val) || 0)}
                        placeholder="1"
                        type="number"
                      />
                      <InputField
                        label="Rate (₹)"
                        value={String(service.rate || '')}
                        onChange={(val) => updateService(index, 'rate', Number(val) || 0)}
                        placeholder="15000"
                        type="number"
                      />
                      <InputField
                        label="Amount (₹)"
                        value={String(service.amount || '')}
                        onChange={(val) => updateService(index, 'amount', Number(val) || 0)}
                        placeholder="15000"
                        type="number"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addServiceRow}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50/50 hover:border-blue-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Service
                </button>

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200">
                  <InputField
                    label="Grand Total (₹) [Manual Entry]"
                    value={String(grandTotal || '')}
                    onChange={(val) => setGrandTotal(Number(val) || 0)}
                    placeholder="17700"
                    type="number"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the exact grand total to appear on the invoice without auto-calculation.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* ─── Payment Details Section ─── */}
            <SectionCard title="Payment Details" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Payment Mode" value={paymentMode} onChange={setPaymentMode} placeholder="NEFT" />
                  <InputField label="UTR / Reference No." value={utrNumber} onChange={setUtrNumber} placeholder="MAHBN12026062856866433" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Amount Received (₹)"
                    value={String(amountReceived || '')}
                    onChange={(val) => setAmountReceived(Number(val) || 0)}
                    placeholder="17700"
                    type="number"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PARTIALLY PAID' | 'UNPAID')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white transition-all font-medium"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                      <option value="UNPAID">UNPAID</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ─── Terms & Conditions Section ─── */}
            <SectionCard title="Terms & Conditions" icon={<ScrollText className="w-4 h-4" />}>
              <div className="space-y-3">
                {termsAndConditions.map((term, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => updateTerm(index, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white transition-all"
                    />
                    {termsAndConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTerm(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove condition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTerm}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50/50 hover:border-blue-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>
            </SectionCard>

            {/* ─── Footer Section ─── */}
            <SectionCard title="Footer Contact Information" icon={<Globe className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Phone" value={footerPhone} onChange={setFooterPhone} placeholder="+91 98765 43210" />
                  <InputField label="Email" value={footerEmail} onChange={setFooterEmail} placeholder="info@chvapps.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Website" value={footerWebsite} onChange={setFooterWebsite} placeholder="www.chvapps.com" />
                  <InputField label="Address" value={footerAddress} onChange={setFooterAddress} placeholder="Visakhapatnam, Andhra Pradesh, India" />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: LIVE A4 PREVIEW (5 COLS ON XL)     */}
          {/* ════════════════════════════════════════════════ */}
          <div className="xl:col-span-5 xl:sticky xl:top-4 h-fit">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Live A4 Document Preview
                </h3>
                <Button
                  onClick={handleExportPDF}
                  variant="primary"
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>

              <div className="p-3 bg-slate-100">
                {/* A4 Container matching exact 210:297 ratio */}
                <div
                  className="bg-white shadow-xl mx-auto overflow-hidden relative border border-slate-200"
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    aspectRatio: '210 / 297',
                  }}
                >
                  {/* Scaled content */}
                  <div className="w-full h-full relative overflow-y-auto" style={{ fontSize: '0.52em' }}>
                    {/* ─── Top-left blue decorative corner ─── */}
                    <div
                      className="absolute top-0 left-0 w-8 h-8 bg-[#0F2149]"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                        zIndex: 0,
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 w-7 h-7 border-r border-b border-[#0EA5E9]"
                      style={{
                        borderRadius: '0 0 100% 0',
                        zIndex: 0,
                      }}
                    />

                    {/* ─── Header area ─── */}
                    <div className="relative z-10 px-5 pt-3 pb-2">
                      <div className="flex items-start justify-between">
                        {/* Logo + Company (Centered in header) */}
                        <div className="flex-1 flex flex-col items-center justify-center pr-2">
                          {logoBase64 ? (
                            <img src={logoBase64} alt="Logo" className="w-7 h-7 object-contain mb-1" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#0EA5E9] via-[#2563EB] to-[#0F2149] flex items-center justify-center text-white font-black text-xs shadow mb-1">
                              C
                            </div>
                          )}
                          <div className="text-[12px] font-black text-[#0F2149] tracking-tight leading-tight text-center">
                            {companyName || 'CHVAPPS LLP'}
                          </div>
                          <div className="text-[7.5px] text-slate-500 italic mt-0.5 text-center">
                            {tagline || 'Your Vision, Our Innovation'}
                          </div>
                        </div>

                        {/* TAX INVOICE banner */}
                        <div className="bg-[#0F2149] px-3.5 py-1 rounded-md shadow-sm relative overflow-hidden flex items-center shrink-0 mt-1">
                          <span className="text-white font-black text-[10px] tracking-wider pr-2">
                            TAX INVOICE
                          </span>
                          <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#0EA5E9] transform skew-x-[-20deg]" />
                        </div>
                      </div>
                    </div>

                    {/* ─── Bill To & Details ─── */}
                    <div className="px-5 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Left: Bill To */}
                        <div>
                          <div className="bg-[#E0ECFF] text-[#1E40AF] px-2 py-0.5 rounded font-bold text-[8px] inline-block mb-1.5">
                            Bill To
                          </div>
                          <div className="text-[10px] font-extrabold text-[#0F2149] mb-0.5">
                            {(customerName || '—').toUpperCase()}
                          </div>
                          {customerGstin && (
                            <div className="text-[7.5px] font-bold text-slate-700 mb-0.5">
                              GSTIN : {customerGstin}
                            </div>
                          )}
                          {billingAddress && (
                            <div className="text-[7px] text-slate-600 mb-0.5">
                              📍 {billingAddress}
                            </div>
                          )}
                          {customerPhone && (
                            <div className="text-[7px] text-slate-600">
                              📞 {customerPhone}
                            </div>
                          )}
                          {customerEmail && (
                            <div className="text-[7px] text-slate-600">
                              ✉ {customerEmail}
                            </div>
                          )}
                        </div>

                        {/* Right: Invoice Details Box */}
                        <div>
                          <div className="border border-slate-300 rounded text-[7.5px] overflow-hidden">
                            {[
                              ['Seller', sellerName || 'CHVAPPS LLP'],
                              ['GSTIN', sellerGstin || DEFAULT_SELLER_GSTIN],
                              ['Invoice No.', invoiceNumber || '—'],
                              ['Invoice Date', invoiceDate || '—'],
                              ['Authorized Signatory', authorizedSignatory || DEFAULT_SIGNATORY],
                            ].map(([label, value], i) => (
                              <div
                                key={i}
                                className={`flex px-2 py-1 items-center ${
                                  label === 'Invoice Date' ? 'bg-[#E8F1FF]' : ''
                                } ${i < 4 ? 'border-b border-slate-200' : ''}`}
                              >
                                <span className="font-bold text-[#0F2149] w-[44%]">{label}</span>
                                <span className="text-slate-400 w-[5%]">:</span>
                                <span className="text-slate-700 w-[51%] truncate font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Services Table ─── */}
                    <div className="px-5 py-2">
                      <table className="w-full text-[7.5px] border-collapse border border-slate-200">
                        <thead>
                          <tr className="bg-[#0F2149] text-white">
                            <th className="py-1 px-1.5 text-center font-bold border border-[#0F2149]">S. No.</th>
                            <th className="py-1 px-1.5 text-left font-bold border border-[#0F2149]">Description of Services</th>
                            <th className="py-1 px-1.5 text-center font-bold border border-[#0F2149]">SAC</th>
                            <th className="py-1 px-1.5 text-center font-bold border border-[#0F2149]">Qty</th>
                            <th className="py-1 px-1.5 text-right font-bold border border-[#0F2149]">Rate (₹)</th>
                            <th className="py-1 px-1.5 text-right font-bold border border-[#0F2149]">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.filter((s) => s.description.trim()).map((s, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]'}>
                              <td className="py-1 px-1.5 text-center border border-slate-200">{i + 1}</td>
                              <td className="py-1 px-1.5 text-left border border-slate-200 font-medium">{s.description}</td>
                              <td className="py-1 px-1.5 text-center border border-slate-200">{s.sac}</td>
                              <td className="py-1 px-1.5 text-center border border-slate-200">{s.qty}</td>
                              <td className="py-1 px-1.5 text-right border border-slate-200">
                                {s.rate ? formatINR(s.rate).replace('₹', '') : '0.00'}
                              </td>
                              <td className="py-1 px-1.5 text-right border border-slate-200 font-semibold">
                                {s.amount ? formatINR(s.amount).replace('₹', '') : '0.00'}
                              </td>
                            </tr>
                          ))}
                          {services.filter((s) => s.description.trim()).length === 0 && (
                            <tr className="bg-white">
                              <td colSpan={6} className="py-3 px-2 text-center text-slate-400 italic">
                                No services added yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-white font-bold">
                            <td colSpan={4} className="border-0" />
                            <td className="py-1 px-1.5 text-right bg-[#0F2149] text-white">Grand Total</td>
                            <td className="py-1 px-1.5 text-right bg-[#0F2149] text-white">{formatINR(grandTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* ─── Payment Details ─── */}
                    <div className="px-5 py-2">
                      <div className="bg-[#E0ECFF] text-[#1E40AF] px-2 py-0.5 rounded font-bold text-[8px] inline-block mb-1.5">
                        Payment Details
                      </div>
                      <div className="border border-slate-300 rounded text-[7.5px] p-2 space-y-1 w-[55%]">
                        <div className="flex"><span className="font-bold text-[#0F2149] w-[44%]">Payment Mode</span><span className="w-[5%]">:</span><span>{paymentMode || '—'}</span></div>
                        <div className="flex"><span className="font-bold text-[#0F2149] w-[44%]">UTR / Ref No.</span><span className="w-[5%]">:</span><span className="truncate">{utrNumber || '—'}</span></div>
                        <div className="flex"><span className="font-bold text-[#0F2149] w-[44%]">Amount Received</span><span className="w-[5%]">:</span><span className="font-semibold">{amountReceived ? formatINR(amountReceived) : '—'}</span></div>
                        <div className="flex items-center">
                          <span className="font-bold text-[#0F2149] w-[44%]">Status</span>
                          <span className="w-[5%]">:</span>
                          <span
                            className={`text-[7px] font-bold px-1.5 py-0.5 rounded text-white ${
                              paymentStatus === 'PAID'
                                ? 'bg-emerald-600'
                                : paymentStatus === 'PARTIALLY PAID'
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                          >
                            {paymentStatus === 'PAID' ? '✓ PAID' : paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ─── Terms & Signature ─── */}
                    <div className="px-5 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Terms */}
                        <div>
                          <div className="bg-[#E0ECFF] text-[#1E40AF] px-2 py-0.5 rounded font-bold text-[8px] inline-block mb-1.5">
                            Terms & Conditions
                          </div>
                          <div className="space-y-1">
                            {(termsAndConditions.filter(t => t.trim()).length > 0
                              ? termsAndConditions.filter(t => t.trim())
                              : DEFAULT_TERMS
                            ).map((term, i) => (
                              <div key={i} className="flex items-start gap-1 text-[7px] text-slate-700 leading-tight">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0 mt-0.5" />
                                <span>{term}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Signature */}
                        <div className="text-center flex flex-col items-center">
                          <div className="text-[8px] font-bold text-[#0F2149] mb-1">
                            For {companyName || 'CHVAPPS LLP'}
                          </div>
                          <div className="border border-slate-300 rounded w-28 h-8 mb-1 bg-slate-50/50" />
                          <div className="w-28 border-b border-slate-300 mb-1" />
                          <div className="text-[8px] font-bold text-[#0F2149]">
                            {authorizedSignatory || DEFAULT_SIGNATORY}
                          </div>
                          <div className="text-[7px] italic text-slate-500">Authorized Signatory</div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0F2149] px-4 py-2 text-white">
                      <div className="flex items-center justify-center gap-3 text-[6.5px] flex-wrap">
                        {footerPhone && <span>📞 {footerPhone}</span>}
                        {footerEmail && <span>✉ {footerEmail}</span>}
                        {footerWebsite && <span>🌐 {footerWebsite}</span>}
                        {footerAddress && <span>📍 {footerAddress}</span>}
                        {!footerPhone && !footerEmail && !footerWebsite && !footerAddress && (
                          <span className="text-white/40 italic">Footer details will appear here</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom-right curved accent */}
                    <div
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#2563EB]"
                      style={{
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note Card */}
            <div className="mt-3 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <span className="font-bold text-blue-600">💡</span>
              <p className="leading-relaxed">
                <strong>Temporary Session:</strong> This tool runs entirely in browser memory. Uploaded logos, client details, and line items are never sent or stored on any server.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span className="text-sm font-medium">{toast.text}</span>
            <button onClick={() => setToast(null)} className="p-0.5 hover:bg-black/5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
