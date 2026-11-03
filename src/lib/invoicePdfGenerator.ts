import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from './fonts/robotoFont';

export interface InvoiceService {
  description: string;
  sac: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  // Company / Header
  companyName: string;
  tagline: string;
  logoBase64: string | null;

  // Seller info (right panel)
  sellerName: string;
  sellerGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  authorizedSignatory: string;

  // Bill To (left panel)
  customerName: string;
  customerGstin: string;
  billingAddress: string;
  customerPhone: string;
  customerEmail: string;

  // Services
  services: InvoiceService[];
  grandTotal: number;

  // Payment
  paymentMode: string;
  utrNumber: string;
  amountReceived: number;
  paymentStatus: 'PAID' | 'PARTIALLY PAID' | 'UNPAID';

  // Terms
  termsAndConditions: string[];

  // Footer
  footerPhone: string;
  footerEmail: string;
  footerWebsite: string;
  footerAddress: string;
}

// Color palette exactly matching the approved tax invoice reference
type ColorTuple = readonly [number, number, number];

const NAVY: ColorTuple = [15, 33, 73]; // #0F2149 - primary deep corporate navy
const CYAN: ColorTuple = [14, 165, 233]; // #0EA5E9 - sky/cyan accent
const ROYAL_BLUE: ColorTuple = [37, 99, 235]; // #2563EB - bright blue accent
const LIGHT_BLUE_BADGE_BG: ColorTuple = [224, 236, 255]; // #E0ECFF
const LIGHT_BLUE_BADGE_TEXT: ColorTuple = [30, 64, 175]; // #1E40AF
const LIGHT_BLUE_ROW: ColorTuple = [240, 246, 255]; // #F0F6FF
const DATE_HIGHLIGHT_BG: ColorTuple = [232, 241, 255]; // #E8F1FF
const BORDER_COLOR: ColorTuple = [203, 213, 225]; // #CBD5E1
const WHITE: ColorTuple = [255, 255, 255];
const TEXT_DARK: ColorTuple = [30, 41, 59]; // #1E293B
const TEXT_MUTED: ColorTuple = [100, 116, 139]; // #64748B

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

// ─── VECTOR ICON HELPERS (Ensures sharp rendering without emoji dependencies) ───
function drawPinIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setFillColor(...color);
  doc.circle(x, y - 1, 1.3, 'F');
  // Small triangle point below circle
  doc.triangle(x - 1, y - 0.5, x + 1, y - 0.5, x, y + 1.2, 'F');
  // Inner white dot
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y - 1, 0.5, 'F');
}

function drawPhoneIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  doc.setLineWidth(0.4);
  // Rounded small handset outline
  doc.roundedRect(x - 1.2, y - 1.5, 2.4, 3, 0.6, 0.6, 'S');
  doc.circle(x, y + 0.5, 0.3, 'F');
}

function drawMailIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = NAVY) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  doc.roundedRect(x - 1.6, y - 1.2, 3.2, 2.4, 0.3, 0.3, 'S');
  // Envelope flap
  doc.line(x - 1.6, y - 1.2, x, y + 0.1);
  doc.line(x + 1.6, y - 1.2, x, y + 0.1);
}

function drawGlobeIcon(doc: jsPDF, x: number, y: number, color: ColorTuple = WHITE) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.circle(x, y, 1.4, 'S');
  doc.line(x - 1.4, y, x + 1.4, y); // equator
  doc.ellipse(x, y, 0.7, 1.4, 'S'); // meridian
}

function drawChvappsHexLogo(doc: jsPDF, x: number, y: number, size = 12) {
  // Hexagonal 3D Cube "C" Logo matching the CHVAPPS brand in the reference
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
  doc.setFontSize(9.5);
  const textWidth = doc.getTextWidth(title);
  const badgeWidth = textWidth + 8;
  const badgeHeight = 5.5;

  doc.setFillColor(...LIGHT_BLUE_BADGE_BG);
  doc.roundedRect(x, y - 4, badgeWidth, badgeHeight, 1.8, 1.8, 'F');

  doc.setTextColor(...LIGHT_BLUE_BADGE_TEXT);
  doc.text(title, x + 4, y);

  return badgeHeight;
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // ─── REGISTER UNICODE FONTS (Supports ₹ and international characters) ───
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto', 'normal');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ─── TOP DECORATIVE SWEEPS / CORNERS ───
  // Top-left curved blue corner matching reference
  doc.setFillColor(...NAVY);
  doc.circle(0, 0, 42, 'F');

  // Cyan inner accent ring on the sweep
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(1.2);
  doc.circle(0, 0, 40, 'S');

  // ─── COMPANY HEADER & LOGO ───
  const headerY = 16;
  const logoX = margin + 3;

  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, 'JPEG', logoX, headerY - 5, 14, 14, undefined, 'FAST');
    } catch {
      drawChvappsHexLogo(doc, logoX, headerY - 5, 14);
    }
  } else {
    drawChvappsHexLogo(doc, logoX, headerY - 5, 14);
  }

  // Company Name
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...NAVY);
  doc.text(data.companyName || 'CHVAPPS LLP', logoX + 17, headerY + 1);

  // Tagline
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(data.tagline || 'Your Vision, Our Innovation', logoX + 17, headerY + 6.5);

  // ─── "TAX INVOICE" TOP-RIGHT BANNER ───
  const bannerWidth = 62;
  const bannerHeight = 11.5;
  const bannerX = pageWidth - margin - bannerWidth;
  const bannerY = headerY - 6;

  // Navy banner capsule
  doc.setFillColor(...NAVY);
  doc.roundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 3.5, 3.5, 'F');

  // Cyan diagonal accent on right side of banner
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

  // "TAX INVOICE" text
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(...WHITE);
  doc.text('TAX INVOICE', bannerX + (bannerWidth - 6) / 2, bannerY + 7.8, { align: 'center' });

  // ─── BILL TO & INVOICE DETAILS SECTION ───
  y = 38;

  // 1. Bill To (Left side)
  const billToX = margin + 2;
  const billToWidth = contentWidth * 0.46;
  drawSectionBadge(doc, 'Bill To', billToX, y);

  let billY = y + 7;

  // Customer Name
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...NAVY);
  doc.text((data.customerName || '—').toUpperCase(), billToX, billY);
  billY += 5.5;

  // Customer GSTIN
  if (data.customerGstin) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    doc.text(`GSTIN : ${data.customerGstin}`, billToX, billY);
    billY += 5;
  }

  // Address
  if (data.billingAddress) {
    drawPinIcon(doc, billToX + 1.2, billY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    const addressLines = doc.splitTextToSize(data.billingAddress, billToWidth - 6);
    doc.text(addressLines, billToX + 4.5, billY);
    billY += addressLines.length * 4.2;
  }

  // Phone
  if (data.customerPhone) {
    drawPhoneIcon(doc, billToX + 1.2, billY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.customerPhone, billToX + 4.5, billY);
    billY += 4.5;
  }

  // Email
  if (data.customerEmail) {
    drawMailIcon(doc, billToX + 1.2, billY - 0.5, NAVY);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(data.customerEmail, billToX + 4.5, billY);
    billY += 4.5;
  }

  // 2. Invoice Details Box (Right side)
  const detailsX = margin + contentWidth * 0.49;
  const detailsWidth = contentWidth * 0.51;
  const detailsY = y - 4;
  const rowHeight = 6.2;
  const detailsRows = [
    ['Seller', data.sellerName || 'CHVAPPS LLP'],
    ['GSTIN', data.sellerGstin || '37AAUFC9629H1ZQ'],
    ['Invoice No.', data.invoiceNumber || '—'],
    ['Invoice Date', data.invoiceDate || '—'],
    ['Authorized Signatory', data.authorizedSignatory || 'V. Chandra Krishna'],
  ];

  const totalDetailsHeight = detailsRows.length * rowHeight + 2;

  // Box border
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(detailsX, detailsY, detailsWidth, totalDetailsHeight, 2, 2, 'S');

  // Render rows
  detailsRows.forEach((row, i) => {
    const curY = detailsY + 1 + i * rowHeight;

    // Highlight the "Invoice Date" row with light blue background
    if (row[0] === 'Invoice Date') {
      doc.setFillColor(...DATE_HIGHLIGHT_BG);
      doc.roundedRect(detailsX + 0.5, curY, detailsWidth - 1, rowHeight, 1.5, 1.5, 'F');
    }

    const textY = curY + 4.3;

    // Label
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(row[0], detailsX + 3.5, textY);

    // Colon
    doc.text(':', detailsX + detailsWidth * 0.44, textY);

    // Value
    doc.setFont('Roboto', row[0] === 'Invoice No.' || row[0] === 'Seller' ? 'bold' : 'normal');
    doc.setTextColor(...TEXT_DARK);
    doc.text(row[1], detailsX + detailsWidth * 0.49, textY);

    // Row separator (except last)
    if (i < detailsRows.length - 1 && row[0] !== 'Invoice No.' && row[0] !== 'Invoice Date') {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(detailsX + 3, curY + rowHeight, detailsX + detailsWidth - 3, curY + rowHeight);
    }
  });

  // ─── SERVICES TABLE ───
  y = Math.max(billY, detailsY + totalDetailsHeight) + 6;

  const tableHead = [['S. No.', 'Description of Services', 'SAC', 'Qty', 'Rate (₹)', 'Amount (₹)']];
  const tableBody = data.services
    .filter((s) => s.description.trim())
    .map((s, i) => [
      String(i + 1),
      s.description,
      s.sac || '',
      String(s.qty || 1),
      formatRupeeNumber(s.rate || 0),
      formatRupeeNumber(s.amount || 0),
    ]);

  // Grand Total row
  tableBody.push([
    '',
    '',
    '',
    '',
    'Grand Total',
    formatIndianRupee(data.grandTotal || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 8.5,
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
      halign: 'center',
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BLUE_ROW as unknown as [number, number, number],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 30 },
    },
    didParseCell: (hookData) => {
      // Grand Total styling
      if (hookData.section === 'body' && hookData.row.index === tableBody.length - 1) {
        if (hookData.column.index >= 4) {
          hookData.cell.styles.fillColor = NAVY as unknown as [number, number, number];
          hookData.cell.styles.textColor = WHITE as unknown as [number, number, number];
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fontSize = 9.5;
        } else {
          // Empty transparent cells
          hookData.cell.styles.fillColor = WHITE as unknown as [number, number, number];
          hookData.cell.styles.lineWidth = 0;
        }
      }
    },
  });

  // Position after table
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // If table went too close to bottom, add page
  if (y + 80 > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  // ─── PAYMENT DETAILS SECTION ───
  const payX = margin + 2;
  const payWidth = contentWidth * 0.52;
  drawSectionBadge(doc, 'Payment Details', payX, y);

  const payBoxY = y + 2;
  const payBoxHeight = 31;

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(payX, payBoxY, payWidth, payBoxHeight, 2, 2, 'S');

  const payRows = [
    ['Payment Mode', data.paymentMode || '—'],
    ['UTR / Reference No.', data.utrNumber || '—'],
    ['Amount Received', data.amountReceived ? formatIndianRupee(data.amountReceived) : '—'],
  ];

  payRows.forEach((row, i) => {
    const rY = payBoxY + 5.5 + i * 6;
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(row[0], payX + 3.5, rY);
    doc.text(':', payX + payWidth * 0.44, rY);

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(...TEXT_DARK);
    doc.text(row[1], payX + payWidth * 0.49, rY);
  });

  // Status with Badge
  const statusY = payBoxY + 5.5 + 3 * 6;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('Status', payX + 3.5, statusY);
  doc.text(':', payX + payWidth * 0.44, statusY);

  const statusVal = data.paymentStatus || 'PAID';
  const badgeX = payX + payWidth * 0.49;
  const isPaid = statusVal === 'PAID';
  const isPartial = statusVal === 'PARTIALLY PAID';

  const badgeBg = isPaid
    ? [22, 163, 74]
    : isPartial
    ? [234, 179, 8]
    : [220, 38, 38];

  doc.setFillColor(...(badgeBg as [number, number, number]));
  doc.roundedRect(badgeX, statusY - 3.2, 19, 4.5, 1.2, 1.2, 'F');

  // Checkmark inside badge if PAID
  if (isPaid) {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(badgeX + 2, statusY - 1, badgeX + 3, statusY + 0.2);
    doc.line(badgeX + 3, statusY + 0.2, badgeX + 4.5, statusY - 1.8);
  }

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(statusVal, badgeX + (isPaid ? 6 : 2), statusY);

  // ─── TERMS & CONDITIONS (Below Payment Details) ───
  let termsY = payBoxY + payBoxHeight + 6;
  drawSectionBadge(doc, 'Terms & Conditions', payX, termsY);
  termsY += 6;

  const termsList =
    data.termsAndConditions.length > 0
      ? data.termsAndConditions
      : [
          'This is a computer generated tax invoice.',
          'All amounts are in Indian Rupees (₹).',
          'Payment is to be made as per the terms agreed.',
          'This invoice is valid for the services mentioned above.',
        ];

  termsList.forEach((term) => {
    // Royal blue bullet dot
    doc.setFillColor(...ROYAL_BLUE);
    doc.circle(payX + 2, termsY - 1, 0.9, 'F');

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(term, payX + 5, termsY);
    termsY += 4.5;
  });

  // ─── AUTHORIZED SIGNATURE AREA (Right Side) ───
  const sigX = margin + contentWidth * 0.62;
  const sigWidth = contentWidth * 0.38;
  const sigStartY = payBoxY + 5;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(`For ${data.companyName || 'CHVAPPS LLP'}`, sigX + sigWidth / 2, sigStartY, {
    align: 'center',
  });

  // Blank signature box
  const sigBoxY = sigStartY + 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(sigX + (sigWidth - 55) / 2, sigBoxY, 55, 18, 2, 2, 'S');

  // Signatory name line & title
  const sigLineY = sigBoxY + 23;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(sigX + 5, sigLineY, sigX + sigWidth - 5, sigLineY);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(data.authorizedSignatory || 'V. Chandra Krishna', sigX + sigWidth / 2, sigLineY + 4.5, {
    align: 'center',
  });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Authorized Signatory', sigX + sigWidth / 2, sigLineY + 8.5, { align: 'center' });

  // ─── DARK NAVY FOOTER ───
  const footerHeight = 16;
  const footerY = pageHeight - footerHeight;

  // Navy footer background with curved top edge
  doc.setFillColor(...NAVY);
  doc.roundedRect(0, footerY - 4, pageWidth, footerHeight + 6, 6, 0, 'F');

  // Bottom-right decorative curved wave in Royal Blue / Cyan
  doc.setFillColor(...ROYAL_BLUE);
  doc.circle(pageWidth, pageHeight, 28, 'F');

  // Footer text with vector icons
  const footerItems: Array<{ type: 'phone' | 'mail' | 'web' | 'pin'; text: string }> = [];
  if (data.footerPhone) footerItems.push({ type: 'phone', text: data.footerPhone });
  if (data.footerEmail) footerItems.push({ type: 'mail', text: data.footerEmail });
  if (data.footerWebsite) footerItems.push({ type: 'web', text: data.footerWebsite });
  if (data.footerAddress) footerItems.push({ type: 'pin', text: data.footerAddress });

  if (footerItems.length > 0) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);

    // Calculate total width to center on the footer
    const gap = 10;
    const itemWidths = footerItems.map((item) => doc.getTextWidth(item.text) + 5);
    const totalItemsWidth =
      itemWidths.reduce((a, b) => a + b, 0) + (footerItems.length - 1) * gap;

    let curItemX = (pageWidth - totalItemsWidth) / 2;
    const itemY = footerY + 4;

    footerItems.forEach((item, idx) => {
      // Draw icon
      if (item.type === 'phone') drawPhoneIcon(doc, curItemX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'mail') drawMailIcon(doc, curItemX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'web') drawGlobeIcon(doc, curItemX + 1.5, itemY - 0.8, WHITE);
      else if (item.type === 'pin') drawPinIcon(doc, curItemX + 1.5, itemY - 0.8, WHITE);

      // Draw text
      doc.text(item.text, curItemX + 4.5, itemY);
      curItemX += itemWidths[idx] + gap;
    });
  }

  // ─── SAVE THE PDF ───
  const fileName = data.invoiceNumber
    ? `CHVAPPS_Tax_Invoice_${data.invoiceNumber.replace(/[\/\\]/g, '_')}.pdf`
    : 'CHVAPPS_Tax_Invoice.pdf';

  doc.save(fileName);
}
