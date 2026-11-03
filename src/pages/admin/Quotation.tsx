import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
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
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  generateQuotationPDF,
  QuotationData,
  ServiceModule,
  PricingItem,
  QuotationTerm,
} from '../../lib/quotationPdfGenerator';

// ─── DEFAULT VALUES ───
const DEFAULT_COMPANY_NAME = 'CHVApps LLP';
const DEFAULT_TAGLINE = 'DIGITAL MARKETING & MEDIA SOLUTIONS';
const DEFAULT_ADDRESS =
  'Ganesh Theatre, Opposite Building,\nTagarapuvalasa (531163), Visakhapatnam, AP';
const DEFAULT_EMAIL = 'chvapps7@gmail.com';
const DEFAULT_PHONE = '+91 70755 31402';
const DEFAULT_WEBSITE = 'www.chvapps.com';

const DEFAULT_OBJECTIVE_HEADING =
  'Comprehensive Social Media Marketing & Meta Ads Strategy (1-Month Growth Plan)';
const DEFAULT_OBJECTIVE_DESC =
  'A comprehensive marketing strategy focused on brand awareness, audience engagement and lead generation across high-converting digital channels.';

const DEFAULT_SERVICE_MODULES: ServiceModule[] = [
  {
    id: 'mod-1',
    title: 'MODULE 1: Video Content Production',
    highlight: '6 HIGH-IMPACT VIDEOS',
    introduction:
      'End-to-end short-form video generation tailored for Reels, Stories and Feed placements to maximize algorithmic reach and visual brand recall.',
    bulletPoints: [
      'Conceptualization & Scripting: Viral hook ideation and storyboard planning based on target customer persona.',
      'Professional Editing: Dynamic transitions, motion text overlays, sound design, and color grading.',
      'Format Optimization: 9:16 vertical delivery optimized for Instagram Reels, YouTube Shorts, and Meta ad specs.',
    ],
  },
  {
    id: 'mod-2',
    title: 'MODULE 2: Graphic Design & Publishing',
    highlight: '5 CUSTOM POSTERS',
    introduction:
      'Custom-branded static visual graphics designed to build trust, educate potential customers, and maintain a polished brand presence.',
    bulletPoints: [
      'Custom Creative Design: High-resolution branded social creatives for promotional offers, services, and product highlights.',
      'Brand Identity Alignment: Strict adherence to corporate typography, brand colors, and visual aesthetic guidelines.',
      'Content Scheduling & Publishing: Strategic posting cadence with compelling copy, persuasive CTAs, and targeted hashtags.',
    ],
  },
  {
    id: 'mod-3',
    title: 'MODULE 3: Meta Ads Campaign Setup & Management',
    highlight: 'TARGETED CAMPAIGNS',
    introduction:
      'Performance marketing campaigns designed to capture high-intent leads and build local market awareness through Facebook and Instagram advertising.',
    bulletPoints: [
      'Multi-Objective Strategy: Balanced campaign architecture driving immediate qualified inquiries and sustainable brand recognition.',
      'Audience Targeting: Hyper-local geo-targeting, demographic layering, and interest-based segmentation.',
      'Lead Capture Form Setup: Seamless in-app Instant Lead Forms integrated for instant customer data collection.',
      'Performance Optimization: Continuous A/B split testing of ad creatives, headlines, placements, and bid adjustments.',
    ],
  },
  {
    id: 'mod-4',
    title: 'MODULE 4: Account Management & Reporting',
    highlight: 'FULL MANAGEMENT',
    introduction:
      'Ongoing support and analytics tracking throughout the campaign cycle to ensure consistent milestone delivery and transparent ROI.',
    bulletPoints: [
      'Content Calendar Creation: Monthly content schedule shared in advance for review and approval.',
      'Basic Comment and Inquiry Monitoring: Daily monitoring of ad and post comments with prompt escalation.',
      'Monthly Performance Analytics Report: Comprehensive breakdown of impressions, reach, leads, CPL, and strategic recommendations.',
    ],
  },
];

const DEFAULT_PRICING_ITEMS: PricingItem[] = [
  {
    id: 'price-1',
    item: 'Digital Marketing & Content Execution Retainer',
    description:
      'Complete monthly package including 6 High-Impact Videos, 5 Custom Posters, Meta Ads Setup & Daily Optimization, and Performance Analytics Reporting.',
    amount: 15000,
  },
];

const DEFAULT_TERMS: QuotationTerm[] = [
  {
    id: 'term-1',
    heading: 'Payment Terms',
    description:
      '50% mobilization advance upon proposal acceptance and issuance of work order; the remaining 50% upon reaching the mid-campaign milestone or final deliverable sign-off.',
  },
  {
    id: 'term-2',
    heading: 'Ad Budget Allocation',
    description:
      'Direct platform ad spend on Meta (Facebook & Instagram) or Google is not included in the service retainer and shall be billed directly to the client’s payment method.',
  },
  {
    id: 'term-3',
    heading: 'Client Deliverables & Approvals',
    description:
      'The client shall provide necessary brand assets, product footage, and feedback within 48 hours to adhere to the agreed publishing calendar and milestone schedules.',
  },
  {
    id: 'term-4',
    heading: 'Scope Adjustments',
    description:
      'Any additional revisions beyond the standard allocation (2 rounds per deliverable) or requests for out-of-scope services will be estimated and billed separately upon mutual consent.',
  },
  {
    id: 'term-5',
    heading: 'Ad Account & Access',
    description:
      'The client agrees to grant partner or advertiser-level access to their Meta Business Manager, Facebook Page, and Instagram account prior to campaign execution.',
  },
  {
    id: 'term-6',
    heading: 'Validity',
    description:
      'This commercial proposal and outlined deliverables are valid for 15 days from the date of quotation issuance. Commencing work is subject to schedule availability thereafter.',
  },
];

// Helper to format Date as DD/MM/YYYY
function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function parseDateDDMMYYYY(s: string): Date | null {
  const parts = s.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m, d);
    }
  }
  return null;
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

// ─── REUSABLE UI CARD COMPONENT ───
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

// ─── REUSABLE INPUT COMPONENT ───
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

// ─── REUSABLE TEXTAREA COMPONENT ───
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
// MAIN QUOTATION PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export const Quotation: React.FC = () => {
  // ─── 1. Company Information State ───
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE);
  const [companyAddress, setCompanyAddress] = useState(DEFAULT_ADDRESS);
  const [companyEmail, setCompanyEmail] = useState(DEFAULT_EMAIL);
  const [companyPhone, setCompanyPhone] = useState(DEFAULT_PHONE);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 2. Quotation Details State ───
  const today = new Date();
  const [quotationNumber, setQuotationNumber] = useState(
    `CHV/QTN/${today.getFullYear()}/001`
  );
  const [quotationDate, setQuotationDate] = useState(formatDate(today));
  const [validUntil, setValidUntil] = useState(formatDate(addDays(today, 15)));
  const [hasManuallyEditedValidUntil, setHasManuallyEditedValidUntil] = useState(false);

  // Auto-update Valid Until when Quotation Date changes
  const handleQuotationDateChange = (newDateStr: string) => {
    setQuotationDate(newDateStr);
    if (!hasManuallyEditedValidUntil) {
      const parsed = parseDateDDMMYYYY(newDateStr);
      if (parsed) {
        setValidUntil(formatDate(addDays(parsed, 15)));
      }
    }
  };

  const handleValidUntilChange = (newDateStr: string) => {
    setValidUntil(newDateStr);
    setHasManuallyEditedValidUntil(true);
  };

  // ─── 3. Prepared For (Customer Details) ───
  const [customerName, setCustomerName] = useState('');
  const [customerBusiness, setCustomerBusiness] = useState('');
  const [customerDesignation, setCustomerDesignation] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // ─── 4. Proposal Objective ───
  const [objectiveHeading, setObjectiveHeading] = useState(DEFAULT_OBJECTIVE_HEADING);
  const [objectiveDescription, setObjectiveDescription] = useState(DEFAULT_OBJECTIVE_DESC);

  // ─── 5. Detailed Keypoints of Services & Deliverables ───
  const [serviceModules, setServiceModules] = useState<ServiceModule[]>([
    ...DEFAULT_SERVICE_MODULES,
  ]);

  // ─── 6. Commercial Pricing Breakdown ───
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([
    ...DEFAULT_PRICING_ITEMS,
  ]);
  const [subtotalInvestment, setSubtotalInvestment] = useState<number>(15000);
  const [totalQuotationAmount, setTotalQuotationAmount] = useState<number>(15000);

  // ─── 7. Terms & Conditions ───
  const [terms, setTerms] = useState<QuotationTerm[]>([...DEFAULT_TERMS]);

  // ─── 8. Signatures & Authorization ───
  const [authorizedByName, setAuthorizedByName] = useState(
    'Authorized Business Representative'
  );
  const [authorizedByCompany, setAuthorizedByCompany] = useState('For CHVApps LLP');
  const [acceptedByName, setAcceptedByName] = useState('');
  const [acceptedByDesignation, setAcceptedByDesignation] = useState('');
  const [acceptedByBusiness, setAcceptedByBusiness] = useState('');
  const [acceptedByLocation, setAcceptedByLocation] = useState('');

  // Auto-sync acceptedByName when customerName changes if not explicitly customized
  useEffect(() => {
    if (!acceptedByName) {
      setAcceptedByName(customerName);
    }
  }, [customerName]);

  // ─── 9. Footer Information ───
  const [footerPhone, setFooterPhone] = useState(DEFAULT_PHONE);
  const [footerEmail, setFooterEmail] = useState(DEFAULT_EMAIL);
  const [footerWebsite, setFooterWebsite] = useState(DEFAULT_WEBSITE);
  const [footerAddress, setFooterAddress] = useState('Visakhapatnam, AP');

  // ─── UI / Toast / Preview Tab State ───
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Logo Upload Handlers ───
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Logo file must be under 5MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('error', 'Only PNG and JPEG formats are supported');
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

  // ─── Service Module Handlers ───
  const addServiceModule = () => {
    const nextNum = serviceModules.length + 1;
    const newMod: ServiceModule = {
      id: `mod-${Date.now()}`,
      title: `MODULE ${nextNum}: New Service Component`,
      highlight: 'CORE DELIVERABLE',
      introduction: 'Comprehensive execution covering planning, development, and delivery.',
      bulletPoints: ['Milestone 1 execution', 'Quality assurance and testing'],
    };
    setServiceModules((prev) => [...prev, newMod]);
  };

  const removeServiceModule = (id: string) => {
    setServiceModules((prev) => prev.filter((m) => m.id !== id));
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === serviceModules.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...serviceModules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setServiceModules(updated);
  };

  const updateModuleField = (
    id: string,
    field: keyof Omit<ServiceModule, 'id' | 'bulletPoints'>,
    value: string
  ) => {
    setServiceModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addBulletPoint = (moduleId: string) => {
    setServiceModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, bulletPoints: [...m.bulletPoints, 'New specific deliverable'] }
          : m
      )
    );
  };

  const removeBulletPoint = (moduleId: string, bpIndex: number) => {
    setServiceModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, bulletPoints: m.bulletPoints.filter((_, i) => i !== bpIndex) }
          : m
      )
    );
  };

  const updateBulletPoint = (moduleId: string, bpIndex: number, value: string) => {
    setServiceModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              bulletPoints: m.bulletPoints.map((bp, i) => (i === bpIndex ? value : bp)),
            }
          : m
      )
    );
  };

  // ─── Pricing Item Handlers ───
  const addPricingItem = () => {
    const newItem: PricingItem = {
      id: `price-${Date.now()}`,
      item: 'New Service Item',
      description: 'Scope details and deliverables',
      amount: 0,
    };
    setPricingItems((prev) => [...prev, newItem]);
  };

  const removePricingItem = (id: string) => {
    setPricingItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePricingItem = (
    id: string,
    field: keyof Omit<PricingItem, 'id'>,
    value: string | number
  ) => {
    setPricingItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // ─── Terms Handlers ───
  const addTerm = () => {
    const newTerm: QuotationTerm = {
      id: `term-${Date.now()}`,
      heading: 'Additional Condition',
      description: 'Terms and timeline clarification for project execution.',
    };
    setTerms((prev) => [...prev, newTerm]);
  };

  const removeTerm = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
  };

  const moveTerm = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === terms.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...terms];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTerms(updated);
  };

  const updateTermField = (
    id: string,
    field: keyof Omit<QuotationTerm, 'id'>,
    value: string
  ) => {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // ─── Export Quotation PDF Handler ───
  const handleExportPDF = () => {
    if (!customerName.trim()) {
      showToast('error', 'Please enter the Customer Name (Prepared For)');
      return;
    }
    if (!customerLocation.trim()) {
      showToast('error', 'Please enter the Customer Location / Address');
      return;
    }
    if (serviceModules.filter((m) => m.title.trim()).length === 0) {
      showToast('error', 'Please include at least one Service Module');
      return;
    }

    const quotationData: QuotationData = {
      companyName,
      tagline,
      companyAddress,
      companyEmail,
      companyPhone,
      logoBase64,
      quotationNumber,
      quotationDate,
      validUntil,
      customerName,
      customerBusiness,
      customerDesignation,
      customerLocation,
      customerPhone,
      customerEmail,
      objectiveHeading,
      objectiveDescription,
      serviceModules,
      pricingItems,
      subtotalInvestment,
      totalQuotationAmount,
      terms,
      authorizedByName,
      authorizedByCompany,
      acceptedByName,
      acceptedByDesignation,
      acceptedByBusiness,
      acceptedByLocation,
      footerPhone,
      footerEmail,
      footerWebsite,
      footerAddress,
    };

    try {
      generateQuotationPDF(quotationData);
      showToast('success', 'Quotation PDF generated successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
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
              <FileSpreadsheet className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Quotation Generator</h1>
                <span className="text-xs font-mono uppercase bg-blue-500/25 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md font-bold">
                  PROPOSAL ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate professional multi-page commercial proposals for Digital Marketing, Web, and Custom Services
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all font-semibold px-5 py-2.5 rounded-xl border border-blue-400/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Quotation PDF
          </Button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: EDITABLE FORM (7 COLS ON XL)       */}
          {/* ════════════════════════════════════════════════ */}
          <div className="xl:col-span-7 space-y-5">
            {/* 1. Company Information */}
            <SectionCard title="1. Company Information" icon={<Building2 className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Company Name"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="CHVApps LLP"
                  />
                  <InputField
                    label="Tagline"
                    value={tagline}
                    onChange={setTagline}
                    placeholder="DIGITAL MARKETING & MEDIA SOLUTIONS"
                  />
                </div>
                <TextAreaField
                  label="Company Address"
                  value={companyAddress}
                  onChange={setCompanyAddress}
                  placeholder="Visakhapatnam, AP"
                  rows={2}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Company Email"
                    value={companyEmail}
                    onChange={setCompanyEmail}
                    placeholder="chvapps7@gmail.com"
                  />
                  <InputField
                    label="Company Phone"
                    value={companyPhone}
                    onChange={setCompanyPhone}
                    placeholder="+91 70755 31402"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Company Logo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoBase64 ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                      <img
                        src={logoBase64}
                        alt="Logo"
                        className="w-10 h-10 object-contain rounded bg-white p-1 border border-blue-200"
                      />
                      <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                        {logoFileName}
                      </span>
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

            {/* 2. Quotation Details */}
            <SectionCard title="2. Quotation Details" icon={<FileText className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="Quotation Number"
                  value={quotationNumber}
                  onChange={setQuotationNumber}
                  placeholder="CHV/QTN/2026/001"
                  required
                />
                <InputField
                  label="Quotation Date"
                  value={quotationDate}
                  onChange={handleQuotationDateChange}
                  placeholder="DD/MM/YYYY"
                  required
                />
                <InputField
                  label="Valid Until"
                  value={validUntil}
                  onChange={handleValidUntilChange}
                  placeholder="DD/MM/YYYY"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Changing the quotation date automatically recalculates the validity date (+15 days) unless manually customized.
              </p>
            </SectionCard>

            {/* 3. Prepared For */}
            <SectionCard title="3. Prepared For (Customer Information)" icon={<Building2 className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Customer / Client Name"
                    value={customerName}
                    onChange={setCustomerName}
                    placeholder="e.g. John Doe / Business Owner"
                    required
                  />
                  <InputField
                    label="Business / Company Name"
                    value={customerBusiness}
                    onChange={setCustomerBusiness}
                    placeholder="e.g. Ravikiran Beverages"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Designation / Service Context"
                    value={customerDesignation}
                    onChange={setCustomerDesignation}
                    placeholder="e.g. Managing Director"
                  />
                  <InputField
                    label="Location / Address"
                    value={customerLocation}
                    onChange={setCustomerLocation}
                    placeholder="e.g. Visakhapatnam, Andhra Pradesh"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Phone Number (Optional)"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="+91 98765 43210"
                  />
                  <InputField
                    label="Email Address (Optional)"
                    value={customerEmail}
                    onChange={setCustomerEmail}
                    placeholder="client@example.com"
                  />
                </div>
              </div>
            </SectionCard>

            {/* 4. Proposal Objective */}
            <SectionCard title="4. Proposal Objective" icon={<Sparkles className="w-4 h-4" />}>
              <div className="space-y-4">
                <InputField
                  label="Objective Heading"
                  value={objectiveHeading}
                  onChange={setObjectiveHeading}
                  placeholder="Comprehensive Social Media Marketing & Meta Ads Strategy"
                />
                <TextAreaField
                  label="Objective Description"
                  value={objectiveDescription}
                  onChange={setObjectiveDescription}
                  placeholder="Detailed strategic summary of growth plan and deliverables..."
                  rows={2}
                />
              </div>
            </SectionCard>

            {/* 5. Detailed Keypoints of Services & Deliverables */}
            <SectionCard title="5. Services & Deliverables" icon={<Layers className="w-4 h-4" />}>
              <div className="space-y-4">
                {serviceModules.map((mod, modIdx) => (
                  <div
                    key={mod.id}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
                  >
                    {/* Header bar of module */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                          {modIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Module {modIdx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveModule(modIdx, 'up')}
                          disabled={modIdx === 0}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Module Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveModule(modIdx, 'down')}
                          disabled={modIdx === serviceModules.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Module Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {serviceModules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeServiceModule(mod.id)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ml-1"
                            title="Remove Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <InputField
                          label="Module Title"
                          value={mod.title}
                          onChange={(val) => updateModuleField(mod.id, 'title', val)}
                          placeholder="MODULE 1: Video Content Production"
                          required
                        />
                      </div>
                      <div>
                        <InputField
                          label="Highlight Badge"
                          value={mod.highlight}
                          onChange={(val) => updateModuleField(mod.id, 'highlight', val)}
                          placeholder="6 HIGH-IMPACT VIDEOS"
                        />
                      </div>
                    </div>

                    <TextAreaField
                      label="Introduction / Operational Breakdown"
                      value={mod.introduction}
                      onChange={(val) => updateModuleField(mod.id, 'introduction', val)}
                      placeholder="End-to-end delivery overview..."
                      rows={2}
                    />

                    {/* Bullet Points */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-600">
                          Bullet Points & Scope Breakdown
                        </label>
                        <button
                          type="button"
                          onClick={() => addBulletPoint(mod.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Bullet
                        </button>
                      </div>

                      <div className="space-y-2">
                        {mod.bulletPoints.map((bp, bpIdx) => (
                          <div key={bpIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <input
                              type="text"
                              value={bp}
                              onChange={(e) => updateBulletPoint(mod.id, bpIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              placeholder="Deliverable detail..."
                            />
                            {mod.bulletPoints.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulletPoint(mod.id, bpIdx)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove bullet"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addServiceModule}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50/50 hover:border-blue-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Service Module
                </button>
              </div>
            </SectionCard>

            {/* 6. Commercial Investment & Pricing Breakdown */}
            <SectionCard title="6. Commercial Investment & Pricing" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-4">
                {pricingItems.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Pricing Line Item</span>
                      {pricingItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePricingItem(p.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <InputField
                          label="Item / Particulars"
                          value={p.item}
                          onChange={(val) => updatePricingItem(p.id, 'item', val)}
                          placeholder="e.g. Digital Marketing Retainer"
                          required
                        />
                      </div>
                      <div>
                        <InputField
                          label="Amount (₹)"
                          value={String(p.amount || '')}
                          onChange={(val) => updatePricingItem(p.id, 'amount', Number(val) || 0)}
                          placeholder="15000"
                          type="number"
                        />
                      </div>
                    </div>
                    <InputField
                      label="Description"
                      value={p.description}
                      onChange={(val) => updatePricingItem(p.id, 'description', val)}
                      placeholder="e.g. Scope details and monthly execution"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPricingItem}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50/50 hover:border-blue-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Pricing Item
                </button>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Subtotal Investment (₹)"
                    value={String(subtotalInvestment || '')}
                    onChange={(val) => setSubtotalInvestment(Number(val) || 0)}
                    placeholder="15000"
                    type="number"
                    required
                  />
                  <InputField
                    label="TOTAL QUOTATION AMOUNT (₹)"
                    value={String(totalQuotationAmount || '')}
                    onChange={(val) => setTotalQuotationAmount(Number(val) || 0)}
                    placeholder="15000"
                    type="number"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  All commercial figures are manually entered. No automated taxes or GST are calculated.
                </p>
              </div>
            </SectionCard>

            {/* 7. Terms & Conditions */}
            <SectionCard title="7. Terms & Conditions" icon={<ScrollText className="w-4 h-4" />}>
              <div className="space-y-3">
                {terms.map((t, tIdx) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {tIdx + 1}. Condition
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveTerm(tIdx, 'up')}
                          disabled={tIdx === 0}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTerm(tIdx, 'down')}
                          disabled={tIdx === terms.length - 1}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {terms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTerm(t.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <InputField
                      label="Term Heading"
                      value={t.heading}
                      onChange={(val) => updateTermField(t.id, 'heading', val)}
                      placeholder="e.g. Payment Terms"
                    />
                    <TextAreaField
                      label="Condition Description"
                      value={t.description}
                      onChange={(val) => updateTermField(t.id, 'description', val)}
                      placeholder="e.g. 50% mobilization advance upon proposal acceptance..."
                      rows={2}
                    />
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

            {/* 8. Authorization & Acceptance Panels */}
            <SectionCard title="8. Signatures & Authorization" icon={<PenTool className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Left Panel (Company Representative)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Company Header"
                      value={authorizedByCompany}
                      onChange={setAuthorizedByCompany}
                      placeholder="For CHVApps LLP"
                    />
                    <InputField
                      label="Representative Title"
                      value={authorizedByName}
                      onChange={setAuthorizedByName}
                      placeholder="Authorized Business Representative"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Right Panel (Client Acceptance)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Client Signatory Name"
                      value={acceptedByName}
                      onChange={setAcceptedByName}
                      placeholder="Customer Name"
                    />
                    <InputField
                      label="Client Designation"
                      value={acceptedByDesignation}
                      onChange={setAcceptedByDesignation}
                      placeholder="e.g. Managing Director"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Client Business Name"
                      value={acceptedByBusiness}
                      onChange={setAcceptedByBusiness}
                      placeholder="e.g. Ravikiran Beverages"
                    />
                    <InputField
                      label="Client Location"
                      value={acceptedByLocation}
                      onChange={setAcceptedByLocation}
                      placeholder="e.g. Visakhapatnam, AP"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 9. Footer Contact Information */}
            <SectionCard title="9. Footer Information" icon={<Globe className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Phone"
                  value={footerPhone}
                  onChange={setFooterPhone}
                  placeholder="+91 70755 31402"
                />
                <InputField
                  label="Email"
                  value={footerEmail}
                  onChange={setFooterEmail}
                  placeholder="chvapps7@gmail.com"
                />
                <InputField
                  label="Website"
                  value={footerWebsite}
                  onChange={setFooterWebsite}
                  placeholder="www.chvapps.com"
                />
                <InputField
                  label="Address"
                  value={footerAddress}
                  onChange={setFooterAddress}
                  placeholder="Visakhapatnam, AP"
                />
              </div>
            </SectionCard>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: LIVE A4 PREVIEW (5 COLS ON XL)     */}
          {/* ════════════════════════════════════════════════ */}
          <div className="xl:col-span-5 xl:sticky xl:top-4 h-fit">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header & Page Switcher */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Live Preview
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewPage(1)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        previewPage === 1
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Page 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPage(2)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        previewPage === 2
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Page 2
                    </button>
                  </div>

                  <Button
                    onClick={handleExportPDF}
                    variant="primary"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </Button>
                </div>
              </div>

              {/* A4 Document Simulation */}
              <div className="p-3 bg-slate-100">
                <div
                  className="bg-white shadow-xl mx-auto overflow-hidden relative border border-slate-200"
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    aspectRatio: '210 / 297',
                  }}
                >
                  <div className="w-full h-full relative overflow-y-auto" style={{ fontSize: '0.50em' }}>
                    {/* Top-left corner flourish */}
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

                    {/* ─── PAGE 1 PREVIEW ─── */}
                    {previewPage === 1 && (
                      <div className="p-4 space-y-2.5">
                        {/* Header */}
                        <div className="flex items-start justify-between relative z-10 pt-1">
                          <div className="flex-1 flex flex-col items-center justify-center pr-2">
                            {logoBase64 ? (
                              <img src={logoBase64} alt="Logo" className="w-7 h-7 object-contain mb-0.5" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-gradient-to-br from-[#0EA5E9] via-[#2563EB] to-[#0F2149] flex items-center justify-center text-white font-black text-xs shadow mb-0.5">
                                C
                              </div>
                            )}
                            <div className="text-[12px] font-black text-[#0F2149] tracking-tight leading-tight text-center">
                              {companyName || 'CHVApps LLP'}
                            </div>
                            <div className="text-[7.5px] text-slate-500 italic text-center">
                              {tagline || 'DIGITAL MARKETING & MEDIA SOLUTIONS'}
                            </div>
                          </div>

                          <div className="bg-[#0F2149] px-3 py-1 rounded-md shadow-sm relative overflow-hidden flex items-center shrink-0">
                            <span className="text-white font-black text-[9px] tracking-wider pr-1.5">
                              PROPOSAL & QUOTE
                            </span>
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#0EA5E9] transform skew-x-[-20deg]" />
                          </div>
                        </div>

                        {/* Metadata Strip */}
                        <div className="bg-[#F0F6FF] border border-slate-200 rounded px-2 py-1 flex justify-between text-[7.5px]">
                          <div><span className="font-bold text-[#0F2149]">Quote:</span> {quotationNumber}</div>
                          <div><span className="font-bold text-[#0F2149]">Date:</span> {quotationDate}</div>
                          <div><span className="font-bold text-[#0F2149]">Valid:</span> {validUntil}</div>
                        </div>

                        {/* Prepared For & Service Provider */}
                        <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block mb-1">
                              PREPARED FOR
                            </span>
                            <div className="font-bold text-[#0F2149] text-[9px]">
                              {(customerName || 'VALUED CLIENT').toUpperCase()}
                            </div>
                            {customerBusiness && <div className="font-semibold text-slate-700">{customerBusiness}</div>}
                            {customerLocation && <div className="text-slate-600">📍 {customerLocation}</div>}
                            {customerPhone && <div className="text-slate-600">📞 {customerPhone}</div>}
                          </div>

                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block mb-1">
                              SERVICE PROVIDER
                            </span>
                            <div className="font-bold text-[#0F2149] text-[9px]">{companyName}</div>
                            <div className="text-slate-600">📍 {companyAddress.split('\n')[0]}</div>
                            <div className="text-slate-600">📞 {companyPhone}</div>
                          </div>
                        </div>

                        {/* Proposal Objective */}
                        {(objectiveHeading || objectiveDescription) && (
                          <div className="bg-slate-50 border-l-2 border-l-[#2563EB] border border-slate-200 rounded p-2 text-[7.5px]">
                            <div className="font-bold text-[#0F2149] text-[8px] mb-0.5">{objectiveHeading}</div>
                            <div className="text-slate-600">{objectiveDescription}</div>
                          </div>
                        )}

                        {/* Service Modules List */}
                        <div className="space-y-1.5">
                          <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block">
                            KEYPOINTS OF SERVICES & DELIVERABLES
                          </span>

                          {serviceModules.slice(0, 3).map((mod, idx) => (
                            <div key={mod.id} className="border border-slate-200 rounded overflow-hidden text-[7px]">
                              <div className="bg-[#0F2149] text-white px-2 py-0.5 flex justify-between items-center font-bold">
                                <span>{mod.title}</span>
                                {mod.highlight && (
                                  <span className="bg-[#0EA5E9] text-[6.5px] px-1 py-0.2 rounded">
                                    {mod.highlight}
                                  </span>
                                )}
                              </div>
                              <div className="p-1.5 space-y-0.5">
                                <div className="text-slate-700 font-medium">{mod.introduction}</div>
                                {mod.bulletPoints.map((bp, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-1 text-slate-600">
                                    <span className="w-1 h-1 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                                    <span>{bp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {serviceModules.length > 3 && (
                            <div className="text-center text-[7px] text-blue-600 font-semibold italic">
                              + {serviceModules.length - 3} more module(s) continuing on Page 2...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ─── PAGE 2 PREVIEW ─── */}
                    {previewPage === 2 && (
                      <div className="p-4 space-y-2.5">
                        {/* Remaining modules if any */}
                        {serviceModules.length > 3 && (
                          <div className="space-y-1.5">
                            <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block">
                              SERVICES (CONTINUED)
                            </span>
                            {serviceModules.slice(3).map((mod) => (
                              <div key={mod.id} className="border border-slate-200 rounded overflow-hidden text-[7px]">
                                <div className="bg-[#0F2149] text-white px-2 py-0.5 flex justify-between items-center font-bold">
                                  <span>{mod.title}</span>
                                  {mod.highlight && (
                                    <span className="bg-[#0EA5E9] text-[6.5px] px-1 py-0.2 rounded">
                                      {mod.highlight}
                                    </span>
                                  )}
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                  <div className="text-slate-700 font-medium">{mod.introduction}</div>
                                  {mod.bulletPoints.map((bp, bIdx) => (
                                    <div key={bIdx} className="flex items-start gap-1 text-slate-600">
                                      <span className="w-1 h-1 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                                      <span>{bp}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pricing Table */}
                        <div>
                          <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block mb-1">
                            COMMERCIAL INVESTMENT & PRICING
                          </span>
                          <table className="w-full text-[7px] border-collapse border border-slate-200">
                            <thead>
                              <tr className="bg-[#0F2149] text-white">
                                <th className="py-1 px-1.5 text-left">Item / Particulars</th>
                                <th className="py-1 px-1.5 text-left">Description</th>
                                <th className="py-1 px-1.5 text-right">Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pricingItems.map((p, idx) => (
                                <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]'}>
                                  <td className="py-1 px-1.5 font-bold border border-slate-200">{p.item}</td>
                                  <td className="py-1 px-1.5 border border-slate-200">{p.description}</td>
                                  <td className="py-1 px-1.5 text-right font-semibold border border-slate-200">
                                    {formatINR(p.amount).replace('₹', '')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold">
                                <td colSpan={2} className="py-1 px-1.5 text-right">Subtotal Investment</td>
                                <td className="py-1 px-1.5 text-right">{formatINR(subtotalInvestment)}</td>
                              </tr>
                              <tr className="bg-[#0F2149] text-white font-black">
                                <td colSpan={2} className="py-1 px-1.5 text-right">TOTAL QUOTATION AMOUNT</td>
                                <td className="py-1 px-1.5 text-right">{formatINR(totalQuotationAmount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Terms & Conditions */}
                        <div>
                          <span className="bg-[#E0ECFF] text-[#1E40AF] px-1.5 py-0.5 rounded font-bold text-[7px] inline-block mb-1">
                            TERMS & CONDITIONS
                          </span>
                          <div className="space-y-1 text-[6.5px]">
                            {terms.slice(0, 5).map((t, idx) => (
                              <div key={t.id} className="text-slate-700">
                                <span className="font-bold text-[#0F2149]">{idx + 1}. {t.heading}: </span>
                                <span>{t.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Signature Panels */}
                        <div className="grid grid-cols-2 gap-2 text-[7px]">
                          <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                            <div className="font-bold text-[#0F2149]">PREPARED & AUTHORIZED BY</div>
                            <div className="text-slate-600 mb-1">{authorizedByCompany}</div>
                            <div className="border border-slate-300 rounded h-6 mb-1 bg-white" />
                            <div className="font-bold text-[#0F2149]">{authorizedByName}</div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                            <div className="font-bold text-[#0F2149]">ACCEPTED & APPROVED BY</div>
                            <div className="text-slate-600 mb-1">{customerName || 'Client Representative'}</div>
                            <div className="border border-slate-300 rounded h-6 mb-1 bg-white" />
                            <div className="font-bold text-[#0F2149]">
                              {[acceptedByDesignation, acceptedByBusiness].filter(Boolean).join(' - ') ||
                                'Client Authorized Signature'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer on both pages */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0F2149] px-3 py-1.5 text-white flex justify-between items-center text-[6px]">
                      <div className="flex gap-2">
                        {footerPhone && <span>📞 {footerPhone}</span>}
                        {footerEmail && <span>✉ {footerEmail}</span>}
                        {footerAddress && <span>📍 {footerAddress}</span>}
                      </div>
                      <div className="font-bold">
                        Page {previewPage} of 2
                      </div>
                    </div>

                    {/* Bottom-right decorative wave */}
                    <div
                      className="absolute bottom-0 right-0 w-7 h-7 bg-[#2563EB]"
                      style={{
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* In-Memory Note Card */}
            <div className="mt-3 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <span className="font-bold text-blue-600">💡</span>
              <p className="leading-relaxed">
                <strong>Session-Only Proposal:</strong> This generator is completely client-side. Content, custom deliverables, and pricing are kept in memory and never stored in any database.
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

