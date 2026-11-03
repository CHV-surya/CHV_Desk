import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from './fonts/robotoFont';

export interface ServiceModule {
  id: string;
  title: string;
  highlight: string;
  introduction: string;
  bulletPoints: string[];
}

export interface PricingItem {
  id: string;
  item: string;
  description: string;
  amount: number;
}

export interface QuotationTerm {
  id: string;
  heading: string;
  description: string;
}

export interface QuotationData {
  // Company Information
  companyName: string;
  tagline: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  logoBase64: string | null;

  // Quotation Meta
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;

  // Prepared For
  customerName: string;
  customerBusiness: string;
  customerDesignation: string;
  customerLocation: string;
  customerPhone: string;
  customerEmail: string;

  // Proposal Objective
  objectiveHeading: string;
  objectiveDescription: string;

  // Service Modules
  serviceModules: ServiceModule[];

  // Commercial Pricing Breakdown
  pricingItems: PricingItem[];
  subtotalInvestment: number;
  totalQuotationAmount: number;

  // Terms & Conditions
  terms: QuotationTerm[];

  // Authorization & Acceptance
  authorizedByName: string;
  authorizedByCompany: string;
  acceptedByName: string;
  acceptedByDesignation: string;
  acceptedByBusiness: string;
  acceptedByLocation: string;

  // Footer Contact Information
  footerPhone: string;
  footerEmail: string;
  footerWebsite: string;
  footerAddress: string;
}

// ─── CORPORATE COLOR PALETTE (Matching Tax Invoice visual theme) ───
type ColorTuple = readonly [number, number, number];

const NAVY: ColorTuple = [15, 33, 73]; // #0F2149 - deep corporate navy
const CYAN: ColorTuple = [14, 165, 233]; // #0EA5E9 - sky/cyan accent
const ROYAL_BLUE: ColorTuple = [37, 99, 235]; // #2563EB - vibrant blue accent
const LIGHT_BLUE_BADGE_BG: ColorTuple = [224, 236, 255]; // #E0ECFF
const LIGHT_BLUE_BADGE_TEXT: ColorTuple = [30, 64, 175]; // #1E40AF
const LIGHT_BLUE_ROW: ColorTuple = [240, 246, 255]; // #F0F6FF
const BORDER_COLOR: ColorTuple = [203, 213, 225]; // #CBD5E1 - slate-300
const CARD_BG: ColorTuple = [248, 250, 252]; // #F8FAFC - slate-50
const WHITE: ColorTuple = [255, 255, 255];
const TEXT_DARK: ColorTuple = [30, 41, 59]; // #1E293B - slate-800
const TEXT_MUTED: ColorTuple = [100, 116, 139]; // #64748B - slate-500

function formatIndianRupee(num: number): string {
  if (isNaN(num)) return '₹0.00';
  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);
  const formatted = remaining.length
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return `₹${formatted}.${decPart}`;
}

function formatRupeeNumber(num: number): string {
  if (isNaN(num)) return '0.00';
  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);
  const formatted = remaining.length
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return `${formatted}.${decPart}`;
}

// ─── VECTOR ICON HELPERS ───
function drawPinIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setFillColor(...color);
  doc.circle(x, y - 1, 1.3, 'F');
  doc.triangle(x - 1, y - 0.5, x + 1, y - 0.5, x, y + 1.2, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y - 1, 0.5, 'F');
}

function drawPhoneIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  doc.setLineWidth(0.4);
  doc.roundedRect(x - 1.2, y - 1.5, 2.4, 3, 0.6, 0.6, 'S');
  doc.circle(x, y + 0.5, 0.3, 'F');
}

function drawMailIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  doc.roundedRect(x - 1.6, y - 1.2, 3.2, 2.4, 0.3, 0.3, 'S');
  doc.line(x - 1.6, y - 1.2, x, y + 0.1);
  doc.line(x + 1.6, y - 1.2, x, y + 0.1);
}

function drawGlobeIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = WHITE) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.circle(x, y, 1.4, 'S');
  doc.line(x - 1.4, y, x + 1.4, y);
  doc.ellipse(x, y, 0.7, 1.4, 'S');
}

function drawChvappsHexLogo(doc: jsPDF, x: number, y: number, size = 12) {
  const s = size / 2;
  const cx = x + s;
  const cy = y + s;

  // Top face (cyan / bright blue)
  doc.setFillColor(14, 165, 233);
  doc.triangle(cx, cy - s, cx + s * 0.86, cy - s * 0.5, cx, cy, 'F');
  doc.triangle(cx, cy - s, cx - s * 0.86, cy - s * 0.5, cx, cy, 'F');

  // Left face (deep navy)
  doc.setFillColor(15, 33, 73);
  doc.triangle(cx, cy, cx - s * 0.86, cy - s * 0.5, cx - s * 0.86, cy + s * 0.5, 'F');
  doc.triangle(cx, cy, cx - s * 0.86, cy + s * 0.5, cx, cy + s, 'F');

  // Right face (royal blue)
  doc.setFillColor(37, 99, 235);
  doc.triangle(cx, cy, cx + s * 0.86, cy - s * 0.5, cx + s * 0.86, cy + s * 0.5, 'F');
  doc.triangle(cx, cy, cx + s * 0.86, cy + s * 0.5, cx, cy + s, 'F');

  // Inner cutout to form the distinct "C" shape
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, s * 0.38, 'F');
  doc.triangle(cx, cy - s * 0.1, cx + s * 0.7, cy - s * 0.4, cx + s * 0.7, cy + s * 0.4, 'F');
}

function drawSectionBadge(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  const textWidth = doc.getTextWidth(title);
  const badgeWidth = textWidth + 8;
  const badgeHeight = 5.2;

  doc.setFillColor(...LIGHT_BLUE_BADGE_BG);
  doc.roundedRect(x, y - 3.8, badgeWidth, badgeHeight, 1.8, 1.8, 'F');

  doc.setTextColor(...LIGHT_BLUE_BADGE_TEXT);
  doc.text(title, x + 4, y);

  return badgeHeight;
}

// Draw top-left decorative corner on any page
function drawTopLeftCorner(doc: jsPDF) {
  doc.setFillColor(...NAVY);
  doc.circle(0, 0, 20, 'F');

  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.8);
  doc.circle(0, 0, 18.5, 'S');
}

// Draw dark navy footer with page numbering and company contact details
function drawFooterAndPageNumber(
  doc: jsPDF,
  pageNum: number,
  totalPages: number,
  data: QuotationData,
  pageWidth: number,
  pageHeight: number
) {
  const footerHeight = 15;
  const footerY = pageHeight - footerHeight;

  // Navy footer background
  doc.setFillColor(...NAVY);
  doc.roundedRect(0, footerY - 4, pageWidth, footerHeight + 6, 5, 0, 'F');

  // Bottom-right decorative curved wave
  doc.setFillColor(...ROYAL_BLUE);
  doc.circle(pageWidth, pageHeight, 26, 'F');

  // Footer contact icons & text
  const footerItems: Array<{ type: 'phone' | 'mail' | 'web' | 'pin'; text: string }> = [];
  if (data.footerPhone) footerItems.push({ type: 'phone', text: data.footerPhone });
  if (data.footerEmail) footerItems.push({ type: 'mail', text: data.footerEmail });
  if (data.footerWebsite) footerItems.push({ type: 'web', text: data.footerWebsite });
  if (data.footerAddress) footerItems.push({ type: 'pin', text: data.footerAddress });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);

  if (footerItems.length > 0) {
    const gap = 8;
    const itemWidths = footerItems.map((item) => doc.getTextWidth(item.text) + 5);
    const totalItemsWidth =
      itemWidths.reduce((a, b) => a + b, 0) + (footerItems.length - 1) * gap;

    // Place slightly left of center to allow room for page number on right
    let curX = 12;
    const itemY = footerY + 4;

    footerItems.forEach((item, idx) => {
      if (item.type === 'phone') drawPhoneIcon(doc, curX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'mail') drawMailIcon(doc, curX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'web') drawGlobeIcon(doc, curX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'pin') drawPinIcon(doc, curX + 1.5, itemY - 0.8, WHITE);

      doc.text(item.text, curX + 4.5, itemY);
      curX += itemWidths[idx] + gap;
    });
  }

  // Page numbering on the right
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  const pageStr = `Page ${pageNum} of ${totalPages}`;
  doc.text(pageStr, pageWidth - 14, footerY + 4, { align: 'right' });
}

// ═══════════════════════════════════════════════════════════════
// MAIN QUOTATION PDF GENERATOR FUNCTION
// ═══════════════════════════════════════════════════════════════
export function generateQuotationPDF(data: QuotationData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Register TrueType Unicode Fonts
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto', 'normal');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const pageBottomLimit = pageHeight - 22; // Leave space for footer

  // ═══════════════════════════════════════════════════════════
  // PAGE 1: HEADER, DETAILS, PREPARED FOR, OBJECTIVE, SERVICES
  // ═══════════════════════════════════════════════════════════
  drawTopLeftCorner(doc);

  // ─── COMPANY HEADER & LOGO ───
  const headerCenterX = 78;
  const logoSize = 12;
  const logoTopY = 6;

  if (data.logoBase64) {
    try {
      doc.addImage(
        data.logoBase64,
        'JPEG',
        headerCenterX - logoSize / 2,
        logoTopY,
        logoSize,
        logoSize,
        undefined,
        'FAST'
      );
    } catch {
      drawChvappsHexLogo(doc, headerCenterX - logoSize / 2, logoTopY, logoSize);
    }
  } else {
    drawChvappsHexLogo(doc, headerCenterX - logoSize / 2, logoTopY, logoSize);
  }

  // Company Name
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...NAVY);
  doc.text(data.companyName || 'CHVApps LLP', headerCenterX, 22.5, { align: 'center' });

  // Tagline
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(data.tagline || 'DIGITAL MARKETING & MEDIA SOLUTIONS', headerCenterX, 26.5, {
    align: 'center',
  });

  // ─── "QUOTATION" TOP-RIGHT BANNER ───
  const bannerWidth = 62;
  const bannerHeight = 11.5;
  const bannerX = pageWidth - margin - bannerWidth;
  const bannerY = 10;

  // Navy banner capsule
  doc.setFillColor(...NAVY);
  doc.roundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 3.5, 3.5, 'F');

  // Cyan diagonal accent on right side
  doc.setFillColor(...CYAN);
  doc.triangle(
    bannerX + bannerWidth - 6,
    bannerY,
    bannerX + bannerWidth - 2,
    bannerY,
    bannerX + bannerWidth - 6,
    bannerY + bannerHeight,
    'F'
  );
  doc.triangle(
    bannerX + bannerWidth - 2,
    bannerY,
    bannerX + bannerWidth,
    bannerY + bannerHeight,
    bannerX + bannerWidth - 6,
    bannerY + bannerHeight,
    'F'
  );

  // "PROPOSAL & QUOTATION" text
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...WHITE);
  doc.text('PROPOSAL & QUOTE', bannerX + (bannerWidth - 6) / 2, bannerY + 7.5, {
    align: 'center',
  });

  // ─── QUOTATION METADATA STRIP ───
  let y = 32;
  const metaBoxHeight = 7.5;
  doc.setFillColor(...LIGHT_BLUE_ROW);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 2, 2, 'FD');

  const colW = contentWidth / 3;
  // Quotation No.
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('Quote No:', margin + 4, y + 5);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.quotationNumber || 'CHV/QTN/2026/001', margin + 21, y + 5);

  // Quote Date
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Date:', margin + colW + 4, y + 5);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.quotationDate || '—', margin + colW + 14, y + 5);

  // Valid Until
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Valid Until:', margin + colW * 2 + 4, y + 5);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.validUntil || '—', margin + colW * 2 + 21, y + 5);

  y += metaBoxHeight + 5;

  // ─── PREPARED FOR & COMPANY INFO (TWO-COLUMN CARDS) ───
  const cardWidth = (contentWidth - 5) / 2;
  const cardStartY = y;

  // 1. Left Card: PREPARED FOR
  drawSectionBadge(doc, 'PREPARED FOR', margin, y);
  let leftY = y + 7;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text((data.customerName || 'VALUED CLIENT').toUpperCase(), margin + 2, leftY);
  leftY += 4.5;

  if (data.customerBusiness) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.customerBusiness, margin + 2, leftY);
    leftY += 4;
  }

  if (data.customerDesignation) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(data.customerDesignation, margin + 2, leftY);
    leftY += 4;
  }

  if (data.customerLocation) {
    drawPinIcon(doc, margin + 3, leftY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    const locLines = doc.splitTextToSize(data.customerLocation, cardWidth - 8);
    doc.text(locLines, margin + 6.5, leftY);
    leftY += locLines.length * 3.8;
  }

  if (data.customerPhone) {
    drawPhoneIcon(doc, margin + 3, leftY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.customerPhone, margin + 6.5, leftY);
    leftY += 4;
  }

  if (data.customerEmail) {
    drawMailIcon(doc, margin + 3, leftY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.customerEmail, margin + 6.5, leftY);
    leftY += 4;
  }

  // 2. Right Card: COMPANY INFORMATION
  const rightX = margin + cardWidth + 5;
  drawSectionBadge(doc, 'SERVICE PROVIDER', rightX, y);
  let rightY = y + 7;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(data.companyName || 'CHVApps LLP', rightX + 2, rightY);
  rightY += 4.5;

  if (data.companyAddress) {
    drawPinIcon(doc, rightX + 3, rightY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    const addrLines = doc.splitTextToSize(data.companyAddress, cardWidth - 8);
    doc.text(addrLines, rightX + 6.5, rightY);
    rightY += addrLines.length * 3.8;
  }

  if (data.companyPhone) {
    drawPhoneIcon(doc, rightX + 3, rightY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.companyPhone, rightX + 6.5, rightY);
    rightY += 4;
  }

  if (data.companyEmail) {
    drawMailIcon(doc, rightX + 3, rightY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.companyEmail, rightX + 6.5, rightY);
    rightY += 4;
  }

  // Advance Y to max of both columns
  y = Math.max(leftY, rightY) + 3;

  // ─── PROPOSAL OBJECTIVE BOX ───
  if (data.objectiveHeading || data.objectiveDescription) {
    const objPadding = 4;
    const objWidth = contentWidth;

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    const headLines = data.objectiveHeading
      ? doc.splitTextToSize(data.objectiveHeading, objWidth - objPadding * 2)
      : [];

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    const descLines = data.objectiveDescription
      ? doc.splitTextToSize(data.objectiveDescription, objWidth - objPadding * 2)
      : [];

    const objBoxHeight =
      objPadding * 2 + headLines.length * 4.2 + (headLines.length > 0 ? 2 : 0) + descLines.length * 3.8;

    // Draw background
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, objWidth, objBoxHeight, 2, 2, 'FD');

    // Accent line on left
    doc.setFillColor(...ROYAL_BLUE);
    doc.roundedRect(margin, y, 2.5, objBoxHeight, 1, 1, 'F');

    let curObjY = y + objPadding + 3.2;

    if (headLines.length > 0) {
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(headLines, margin + objPadding + 3, curObjY);
      curObjY += headLines.length * 4.2 + 2;
    }

    if (descLines.length > 0) {
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_DARK);
      doc.text(descLines, margin + objPadding + 3, curObjY);
    }

    y += objBoxHeight + 5;
  }

  // ─── SECTION TITLE: KEYPOINTS OF SERVICES & DELIVERABLES ───
  drawSectionBadge(doc, 'DETAILED KEYPOINTS OF SERVICES & DELIVERABLES', margin, y);
  y += 6;

  // ─── RENDER SERVICE MODULES WITH PAGE BREAK CHECK ───
  data.serviceModules.forEach((mod, modIdx) => {
    // Calculate required height for this module
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8.5);

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.8);
    const introLines = mod.introduction
      ? doc.splitTextToSize(mod.introduction, contentWidth - 10)
      : [];

    const bulletLineCount = mod.bulletPoints.reduce((acc, bp) => {
      const lines = doc.splitTextToSize(bp, contentWidth - 14);
      return acc + lines.length;
    }, 0);

    const estimatedHeight =
      8 + // header bar
      (introLines.length > 0 ? introLines.length * 3.6 + 2 : 0) +
      bulletLineCount * 3.6 +
      mod.bulletPoints.length * 1.5 + // spacing between bullets
      5; // padding

    // Check if we need to advance to page 2 (or next page)
    if (y + estimatedHeight > pageBottomLimit) {
      doc.addPage();
      drawTopLeftCorner(doc);
      y = 18;

      // Small header banner continuation
      drawSectionBadge(doc, 'SERVICES & DELIVERABLES (CONTINUED)', margin, y);
      y += 6;
    }

    // Draw Module Card
    const modBoxY = y;
    const modBoxW = contentWidth;

    // Header strip for Module Title & Highlight
    const modHeaderH = 6.5;
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, modBoxY, modBoxW, modHeaderH, 1.5, 1.5, 'F');

    // Title
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text(mod.title || `MODULE ${modIdx + 1}`, margin + 3.5, modBoxY + 4.5);

    // Highlight Pill Badge (right side)
    if (mod.highlight) {
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(7.5);
      const hlWidth = doc.getTextWidth(mod.highlight) + 6;
      const hlX = margin + modBoxW - hlWidth - 3;
      doc.setFillColor(...CYAN);
      doc.roundedRect(hlX, modBoxY + 1.2, hlWidth, 4.2, 1.2, 1.2, 'F');
      doc.setTextColor(...WHITE);
      doc.text(mod.highlight, hlX + 3, modBoxY + 4.2);
    }

    let modContentY = modBoxY + modHeaderH + 3.5;

    // Introduction
    if (introLines.length > 0) {
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...TEXT_DARK);
      doc.text(introLines, margin + 4, modContentY);
      modContentY += introLines.length * 3.6 + 2;
    }

    // Bullet points
    mod.bulletPoints.forEach((bp) => {
      if (!bp.trim()) return;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(7.8);
      const bpLines = doc.splitTextToSize(bp, contentWidth - 14);

      // Royal blue bullet dot
      doc.setFillColor(...ROYAL_BLUE);
      doc.circle(margin + 5, modContentY - 0.8, 0.9, 'F');

      doc.setTextColor(...TEXT_DARK);
      doc.text(bpLines, margin + 8.5, modContentY);
      modContentY += bpLines.length * 3.6 + 1.2;
    });

    const finalModBoxH = modContentY - modBoxY + 1;

    // Draw border outline around entire module card
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, modBoxY, modBoxW, finalModBoxH, 1.5, 1.5, 'S');

    y = modBoxY + finalModBoxH + 4;
  });

  // ═══════════════════════════════════════════════════════════
  // PAGE 2 (OR NEXT): COMMERCIAL INVESTMENT, TERMS, SIGNATURES
  // ═══════════════════════════════════════════════════════════

  // Standard multi-page break: Ensure Pricing & Terms start on Page 2 (or clean page)
  if (doc.getNumberOfPages() === 1 || y + 70 > pageBottomLimit) {
    doc.addPage();
    drawTopLeftCorner(doc);
    y = 16;
  }

  // ─── COMMERCIAL INVESTMENT & PRICING TABLE ───
  drawSectionBadge(doc, 'COMMERCIAL INVESTMENT & PRICING BREAKDOWN', margin, y);
  y += 5;

  const tableHead = [['Item / Particulars', 'Description', 'Amount (₹)']];
  const tableBody = data.pricingItems
    .filter((p) => p.item.trim())
    .map((p) => [
      p.item,
      p.description || '',
      formatRupeeNumber(p.amount || 0),
    ]);

  // Subtotal Investment row
  tableBody.push([
    '',
    'Subtotal Investment',
    formatIndianRupee(data.subtotalInvestment || 0),
  ]);

  // TOTAL QUOTATION AMOUNT row
  tableBody.push([
    '',
    'TOTAL QUOTATION AMOUNT',
    formatIndianRupee(data.totalQuotationAmount || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 8,
      textColor: TEXT_DARK as unknown as [number, number, number],
      lineColor: [226, 232, 240] as unknown as [number, number, number],
      lineWidth: 0.25,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: NAVY as unknown as [number, number, number],
      textColor: WHITE as unknown as [number, number, number],
      font: 'Roboto',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BLUE_ROW as unknown as [number, number, number],
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 35 },
    },
    didParseCell: (hookData) => {
      const totalRows = tableBody.length;
      // Subtotal Row
      if (hookData.section === 'body' && hookData.row.index === totalRows - 2) {
        if (hookData.column.index >= 1) {
          hookData.cell.styles.fillColor = [241, 245, 249] as unknown as [number, number, number];
          hookData.cell.styles.textColor = NAVY as unknown as [number, number, number];
          hookData.cell.styles.fontStyle = 'bold';
        } else {
          hookData.cell.styles.fillColor = WHITE as unknown as [number, number, number];
          hookData.cell.styles.lineWidth = 0;
        }
      }
      // Grand Total Row
      if (hookData.section === 'body' && hookData.row.index === totalRows - 1) {
        if (hookData.column.index >= 1) {
          hookData.cell.styles.fillColor = NAVY as unknown as [number, number, number];
          hookData.cell.styles.textColor = WHITE as unknown as [number, number, number];
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fontSize = 9.5;
        } else {
          hookData.cell.styles.fillColor = WHITE as unknown as [number, number, number];
          hookData.cell.styles.lineWidth = 0;
        }
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ─── TERMS & CONDITIONS SECTION ───
  if (y + 55 > pageBottomLimit) {
    doc.addPage();
    drawTopLeftCorner(doc);
    y = 16;
  }

  drawSectionBadge(doc, 'TERMS & CONDITIONS', margin, y);
  y += 5;

  const validTerms = data.terms.filter((t) => t.heading.trim());

  validTerms.forEach((term, idx) => {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    const headingText = `${idx + 1}. ${term.heading}: `;
    const headingW = doc.getTextWidth(headingText);

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.8);
    const descLines = doc.splitTextToSize(
      term.description,
      contentWidth - headingW - 6
    );

    // If terms will exceed bottom of page, page-break
    if (y + descLines.length * 3.8 + 2 > pageBottomLimit) {
      doc.addPage();
      drawTopLeftCorner(doc);
      y = 16;
      drawSectionBadge(doc, 'TERMS & CONDITIONS (CONTINUED)', margin, y);
      y += 5;
    }

    // Print heading
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(headingText, margin + 3, y);

    // Print description
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(descLines, margin + 3 + headingW, y);

    y += Math.max(1, descLines.length) * 3.8 + 1.5;
  });

  y += 4;

  // ─── AUTHORIZATION & ACCEPTANCE SIGNATURE PANELS ───
  // Signature panels need ~36mm height
  if (y + 40 > pageBottomLimit) {
    doc.addPage();
    drawTopLeftCorner(doc);
    y = 18;
  }

  const sigColW = (contentWidth - 6) / 2;
  const sigH = 34;

  // Left Panel: PREPARED & AUTHORIZED BY
  const leftSigX = margin;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(leftSigX, y, sigColW, sigH, 2, 2, 'FD');

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('PREPARED & AUTHORIZED BY', leftSigX + sigColW / 2, y + 5, { align: 'center' });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.authorizedByCompany || 'For CHVApps LLP', leftSigX + sigColW / 2, y + 9.5, {
    align: 'center',
  });

  // Blank signature rectangle
  doc.setDrawColor(218, 226, 237);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftSigX + (sigColW - 55) / 2, y + 12, 55, 13, 1.5, 1.5, 'FD');

  // Signatory title line
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text(
    data.authorizedByName || 'Authorized Business Representative',
    leftSigX + sigColW / 2,
    y + 29.5,
    { align: 'center' }
  );

  // Right Panel: ACCEPTED & APPROVED BY
  const rightSigX = margin + sigColW + 6;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(rightSigX, y, sigColW, sigH, 2, 2, 'FD');

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('ACCEPTED & APPROVED BY', rightSigX + sigColW / 2, y + 5, { align: 'center' });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  const clientLine = data.acceptedByName || data.customerName || 'Client Representative';
  doc.text(clientLine, rightSigX + sigColW / 2, y + 9.5, { align: 'center' });

  // Blank signature rectangle
  doc.setDrawColor(218, 226, 237);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightSigX + (sigColW - 55) / 2, y + 12, 55, 13, 1.5, 1.5, 'FD');

  // Signatory details
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  const clientRole = [data.acceptedByDesignation, data.acceptedByBusiness]
    .filter(Boolean)
    .join(' - ');
  doc.text(clientRole || 'Client Authorized Signature', rightSigX + sigColW / 2, y + 29.5, {
    align: 'center',
  });

  // ═══════════════════════════════════════════════════════════
  // FOOTER & DYNAMIC PAGE NUMBERING ON ALL PAGES
  // ═══════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooterAndPageNumber(doc, i, totalPages, data, pageWidth, pageHeight);
  }

  // ─── SAVE THE PDF ───
  const safeNumber = (data.quotationNumber || 'CHV_QTN').replace(/[\/\\]/g, '_');
  const fileName = `CHVApps_Quotation_${safeNumber}.pdf`;

  doc.save(fileName);
}
