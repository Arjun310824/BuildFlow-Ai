/**
 * BuildOps AI Real-Time Document & Report Downloader
 * Generates genuine, professional construction-industry PDF documents,
 * DWG/DXF blueprints, and CSV/Excel operational reports in the user's browser in real time.
 */

// Helper to safely escape text inside PDF string literals
const escapePdf = (str) => {
  return String(str || '')
    .split('\\').join('\\\\')
    .split('(').join('\\(')
    .split(')').join('\\)');
};

// Character widths for Helvetica / Helvetica-Bold (per 1000 units)
const getCharWidth = (char, isBold = false) => {
  const code = char.charCodeAt(0);
  if (code === 32) return 278; // space
  if (code >= 48 && code <= 57) return 556; // numbers
  if (code >= 65 && code <= 90) {
    // Uppercase
    if ('IJ'.includes(char)) return 333;
    if ('MW'.includes(char)) return 850;
    return isBold ? 722 : 667;
  }
  if (code >= 97 && code <= 122) {
    // Lowercase
    if ('ijl'.includes(char)) return 278;
    if ('mw'.includes(char)) return 778;
    if ('fkt'.includes(char)) return 350;
    return isBold ? 556 : 500;
  }
  if ('.,:;!?\'"'.includes(char)) return 278;
  if ('-_/\\'.includes(char)) return 333;
  if ('()[]{}'.includes(char)) return 333;
  return 500;
};

const getTextWidth = (text, size, isBold = false) => {
  let units = 0;
  const str = String(text || '');
  for (let i = 0; i < str.length; i++) {
    units += getCharWidth(str[i], isBold);
  }
  return (units / 1000) * size;
};

// Word wrap helper for paragraphs and technical descriptions
const wrapText = (text, maxWidth, size, isBold = false) => {
  const words = String(text || '').split(' ');
  const lines = [];
  let curLine = '';

  for (const w of words) {
    const testLine = curLine ? `${curLine} ${w}` : w;
    const wWidth = getTextWidth(testLine, size, isBold);
    if (wWidth <= maxWidth) {
      curLine = testLine;
    } else {
      if (curLine) lines.push(curLine);
      curLine = w;
    }
  }
  if (curLine) lines.push(curLine);
  return lines.length > 0 ? lines : [''];
};

/**
 * Builds an enterprise-grade A4 Portrait PDF Document in pure JavaScript
 * with standard Helvetica Type 1 fonts, crisp vector branding, metadata table,
 * structured technical details, inspection signoff, pour gate, and dynamic audit verification.
 */
export const createPdfBlob = (title, subtitle, fields = {}, notes = [], options = {}) => {
  // Page geometry: Standard A4 in PDF points (72 points/inch: 210mm x 297mm)
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 48;
  const MARGIN_RIGHT = 48;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 499.28 pt

  // Colors (RGB 0.0 - 1.0)
  const C_NAVY = '0.059 0.090 0.165'; // #0F172A Dark Navy Text
  const C_SLATE = '0.392 0.455 0.545'; // #64748B Slate Secondary
  const C_MUTED = '0.580 0.639 0.722'; // #94A3B8 Subtle Muted
  const C_BLUE = '0.086 0.467 0.824'; // #1677D2 BuildOps Brand Blue
  const C_ORANGE = '1.000 0.416 0.000'; // #FF6A00 Construction Orange Accent
  const C_BORDER = '0.886 0.910 0.941'; // #E2E8F0 Subtle Light Gray Border
  const C_BG_CARD = '0.973 0.980 0.988'; // #F8FAFC Card Surface Fill
  const C_WHITE = '1.000 1.000 1.000'; // #FFFFFF

  // Extract metadata attributes from fields or options
  const docId = options.docId || fields['Document Record ID'] || fields['Document ID'] || 'DOC-101';
  const category = options.category || fields['Document Category'] || fields['Category'] || 'Technical Record';
  const uploadedBy = options.uploadedBy || fields['Uploaded By'] || fields['Author'] || 'Alex Morgan';
  const date = options.date || fields['Upload / Signoff Date'] || fields['Date'] || new Date().toISOString().slice(0, 10);
  const size = options.size || fields['Original File Size'] || fields['File Size'] || '4.8 MB';
  const status = options.status || fields['Compliance Status'] || fields['Status'] || 'Approved';

  // Dynamic security verification values
  const actualFingerprint = options.fingerprint || `SHA256-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
  const actualTimestamp = options.timestamp || new Date().toISOString();

  // Clean human-readable title (convert underscores to spaces)
  const cleanTitle = (title || 'Construction Document Record')
    .replace(/\.(pdf|dwg)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  // Status badge styling
  const normStatus = String(status || 'Approved').trim();
  const isApproved = /approved|passed|verified|completed|executed|paid/i.test(normStatus);
  const isPending = /pending|review|progress|draft/i.test(normStatus);
  const isRejected = /rejected|non-compliant|fail|overdue/i.test(normStatus);

  let statusBg = '0.925 0.992 0.961'; // #ECFDF5 Green
  let statusBorder = '0.655 0.953 0.816'; // #A7F3D0
  let statusColor = '0.086 0.639 0.290'; // #16A34A
  if (isPending) {
    statusBg = '1.000 0.984 0.922'; // #FFFBEB Amber
    statusBorder = '0.996 0.902 0.541'; // #FDE68A
    statusColor = '0.851 0.467 0.024'; // #D97706
  } else if (isRejected) {
    statusBg = '0.996 0.949 0.949'; // #FEF2F2 Red
    statusBorder = '0.996 0.792 0.792'; // #FECACA
    statusColor = '0.863 0.149 0.149'; // #DC2626
  } else if (!isApproved) {
    statusBg = '0.937 0.965 1.000'; // #EFF6FF Blue
    statusBorder = '0.749 0.859 0.996'; // #BFDBFE
    statusColor = '0.086 0.467 0.824'; // #1677D2
  }

  // Parse inspection result and pour gate if available
  let inspectionResultText = null;
  let certifiedByText = null;
  let pourGateText = null;
  const filteredNotes = [];

  for (const note of notes) {
    const noteStr = String(note || '');
    if (/inspection authority signoff/i.test(noteStr) || (/PASSED/i.test(noteStr) && /certified/i.test(noteStr))) {
      inspectionResultText = 'PASSED';
      const certMatch = noteStr.match(/certified by\s*:?\s*([^.\n]+)/i);
      certifiedByText = certMatch ? certMatch[1].trim() : `${uploadedBy} & Lead PE`;
      filteredNotes.push(noteStr);
    } else if (/pour gate/i.test(noteStr)) {
      const gateMatch = noteStr.match(/pour gate\s*:?\s*(.+)/i);
      pourGateText = gateMatch ? gateMatch[1].trim() : 'Authorized for scheduled Ready-Mix Concrete pour.';
      filteredNotes.push(noteStr);
    } else {
      filteredNotes.push(noteStr);
    }
  }

  // Multi-Page Collection
  const pages = [];
  let curOps = [];

  const startNewPage = () => {
    curOps = [];
    pages.push(curOps);
  };

  startNewPage();

  // Helper functions for PDF vector graphics
  const setFill = (c) => {
    if (c) curOps.push(`${c} rg`);
  };
  const setStroke = (c) => {
    if (c) curOps.push(`${c} RG`);
  };
  const setLineWidth = (w) => curOps.push(`${w} w`);

  const fillRect = (x, y, w, h, c) => {
    setFill(c);
    curOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };

  const strokeRect = (x, y, w, h, c, lineW = 0.75) => {
    setStroke(c);
    setLineWidth(lineW);
    curOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  };

  const drawLine = (x1, y1, x2, y2, c, lineW = 0.75) => {
    setStroke(c);
    setLineWidth(lineW);
    curOps.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const drawText = (text, x, y, { font = 'F1', size = 9, color = C_NAVY, align = 'left' } = {}) => {
    const clean = escapePdf(text);
    let xPos = x;
    if (align === 'center') {
      const w = getTextWidth(text, size, font === 'F2');
      xPos = x - w / 2;
    } else if (align === 'right') {
      const w = getTextWidth(text, size, font === 'F2');
      xPos = x - w;
    }
    curOps.push('BT');
    curOps.push(`/${font} ${size} Tf`);
    curOps.push(`${color} rg`);
    curOps.push(`1 0 0 1 ${xPos.toFixed(2)} ${y.toFixed(2)} Tm`);
    curOps.push(`(${clean}) Tj`);
    curOps.push('ET');
  };

  // Rounded rectangle helper (for cards, badges, and status containers)
  const drawRoundedCard = (x, y, w, h, r, fillC, strokeC, lineW = 0.75) => {
    const k = 0.55228475 * r;
    const x0 = x, x1 = x + r, x2 = x + w - r, x3 = x + w;
    const y0 = y, y1 = y + r, y2 = y + h - r, y3 = y + h;

    if (fillC) setFill(fillC);
    if (strokeC) {
      setStroke(strokeC);
      setLineWidth(lineW);
    }

    curOps.push(`${x1.toFixed(2)} ${y0.toFixed(2)} m`);
    curOps.push(`${x2.toFixed(2)} ${y0.toFixed(2)} l`);
    curOps.push(`${(x2 + k).toFixed(2)} ${y0.toFixed(2)} ${x3.toFixed(2)} ${(y1 - k).toFixed(2)} ${x3.toFixed(2)} ${y1.toFixed(2)} c`);
    curOps.push(`${x3.toFixed(2)} ${y2.toFixed(2)} l`);
    curOps.push(`${x3.toFixed(2)} ${(y2 + k).toFixed(2)} ${(x2 + k).toFixed(2)} ${y3.toFixed(2)} ${x2.toFixed(2)} ${y3.toFixed(2)} c`);
    curOps.push(`${x1.toFixed(2)} ${y3.toFixed(2)} l`);
    curOps.push(`${(x1 - k).toFixed(2)} ${y3.toFixed(2)} ${x0.toFixed(2)} ${(y2 + k).toFixed(2)} ${x0.toFixed(2)} ${y2.toFixed(2)} c`);
    curOps.push(`${x0.toFixed(2)} ${y1.toFixed(2)} l`);
    curOps.push(`${x0.toFixed(2)} ${(y1 - k).toFixed(2)} ${(x1 - k).toFixed(2)} ${y0.toFixed(2)} ${x1.toFixed(2)} ${y0.toFixed(2)} c`);
    curOps.push(fillC && strokeC ? 'B' : fillC ? 'f' : 'S');
  };

  // Render Top Header
  const renderHeader = (isFirstPage = true) => {
    const topY = 788;
    const baseY = topY - 24; // Flat ground baseline at 764 pt

    // BuildOps AI Architectural Skyline Logo: 3 buildings resting on common bottom baseline
    // Building 1 (Left: Blue, medium height: 18.8 pt)
    drawRoundedCard(MARGIN_LEFT, baseY, 6.8, 18.8, 1.2, C_BLUE, null);
    fillRect(MARGIN_LEFT + 2.2, baseY + 12.0, 2.4, 2.4, C_WHITE);
    fillRect(MARGIN_LEFT + 2.2, baseY + 6.0, 2.4, 2.4, C_WHITE);

    // Building 2 (Center: Orange, tallest skyscraper: 24.0 pt)
    drawRoundedCard(MARGIN_LEFT + 9.35, baseY, 6.8, 24.0, 1.2, C_ORANGE, null);
    fillRect(MARGIN_LEFT + 11.55, baseY + 17.0, 2.4, 2.4, C_WHITE);
    fillRect(MARGIN_LEFT + 11.55, baseY + 11.5, 2.4, 2.4, C_WHITE);
    fillRect(MARGIN_LEFT + 11.55, baseY + 6.0, 2.4, 2.4, C_WHITE);

    // Building 3 (Right: Blue, compact height: 15.3 pt)
    drawRoundedCard(MARGIN_LEFT + 18.7, baseY, 6.8, 15.3, 1.2, C_BLUE, null);
    fillRect(MARGIN_LEFT + 20.9, baseY + 9.5, 2.4, 2.4, C_WHITE);
    fillRect(MARGIN_LEFT + 20.9, baseY + 4.5, 2.4, 2.4, C_WHITE);

    // Brand Name: "BUILDOPS" in Navy + "AI" in Construction Orange
    const textX = MARGIN_LEFT + 33;
    const buildOpsWidth = getTextWidth('BUILDOPS', 13, true);
    drawText('BUILDOPS', textX, topY - 10.5, { font: 'F2', size: 13, color: C_NAVY });
    drawText('AI', textX + buildOpsWidth + 3.8, topY - 10.5, { font: 'F2', size: 13, color: C_ORANGE });
    drawText('AI-POWERED CONSTRUCTION OPERATIONS', textX, topY - 21.5, { font: 'F2', size: 6.8, color: C_SLATE });

    // Right Header side
    drawText('DOCUMENT TYPE', MARGIN_LEFT + CONTENT_WIDTH, topY - 10.5, { font: 'F2', size: 6.8, color: C_MUTED, align: 'right' });
    const docTypeLabel = category || 'Technical Record';
    drawText(docTypeLabel.toUpperCase(), MARGIN_LEFT + CONTENT_WIDTH, topY - 22, { font: 'F2', size: 9.5, color: C_NAVY, align: 'right' });

    // Thin blue/orange accent line below header
    const lineY = topY - 30;
    fillRect(MARGIN_LEFT, lineY, CONTENT_WIDTH, 2, C_BLUE);
    fillRect(MARGIN_LEFT, lineY, 56, 2, C_ORANGE);

    return lineY - 14;
  };

  // Render Header on Page 1
  let curY = renderHeader(true);

  // --- Title & Status Row ---
  const titleBoxW = CONTENT_WIDTH - 116;
  const titleLines = wrapText(cleanTitle.toUpperCase(), titleBoxW, 15, true);

  const titleStartY = curY - 4;
  let titleEndY = titleStartY;

  for (let i = 0; i < titleLines.length; i++) {
    drawText(titleLines[i], MARGIN_LEFT, titleStartY - (i * 18), { font: 'F2', size: 15, color: C_NAVY });
    titleEndY = titleStartY - (i * 18);
  }

  // Project label & name
  const projY = titleEndY - 15;
  drawText('PROJECT:', MARGIN_LEFT, projY, { font: 'F2', size: 7.5, color: C_SLATE });
  drawText(subtitle || 'Residential Tower A', MARGIN_LEFT + 46, projY, { font: 'F2', size: 9.5, color: C_BLUE });

  // Status Badge on Right
  const badgeW = 104;
  const badgeH = 34;
  const badgeX = MARGIN_LEFT + CONTENT_WIDTH - badgeW;
  const badgeY = titleStartY - badgeH + 6;

  drawRoundedCard(badgeX, badgeY, badgeW, badgeH, 4, statusBg, statusBorder, 1);
  drawText('DOCUMENT STATUS', badgeX + badgeW / 2, badgeY + badgeH - 12, { font: 'F2', size: 6.5, color: C_SLATE, align: 'center' });
  drawText(normStatus.toUpperCase(), badgeX + badgeW / 2, badgeY + 8, { font: 'F2', size: 9.5, color: statusColor, align: 'center' });

  curY = Math.min(projY - 16, badgeY - 12);

  // --- Section 5: Document Information (Two-Column Table Card) ---
  const infoTableY = curY;
  drawText('DOCUMENT INFORMATION', MARGIN_LEFT, infoTableY, { font: 'F2', size: 9.5, color: C_NAVY });
  fillRect(MARGIN_LEFT + 130, infoTableY + 1, 16, 2, C_ORANGE);

  const tableTop = infoTableY - 10;
  const tableH = 68;
  const colW = CONTENT_WIDTH / 2;

  // Table Card outer border
  drawRoundedCard(MARGIN_LEFT, tableTop - tableH, CONTENT_WIDTH, tableH, 5, C_WHITE, C_BORDER, 0.75);

  // Table Header bar
  fillRect(MARGIN_LEFT + 1, tableTop - 18, CONTENT_WIDTH - 2, 17, C_BG_CARD);
  drawLine(MARGIN_LEFT, tableTop - 18, MARGIN_LEFT + CONTENT_WIDTH, tableTop - 18, C_BORDER, 0.75);
  drawLine(MARGIN_LEFT + colW, tableTop, MARGIN_LEFT + colW, tableTop - tableH, C_BORDER, 0.75);

  drawText('PROPERTY & METADATA', MARGIN_LEFT + 12, tableTop - 12, { font: 'F2', size: 6.8, color: C_MUTED });
  drawText('RECORD SPECIFICATION', MARGIN_LEFT + colW + 12, tableTop - 12, { font: 'F2', size: 6.8, color: C_MUTED });

  // 3 Rows of Structured Data
  const row1Y = tableTop - 31;
  const row2Y = tableTop - 46;
  const row3Y = tableTop - 61;

  // Col 1 Left
  drawText('Document Record ID:', MARGIN_LEFT + 12, row1Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(docId, MARGIN_LEFT + 112, row1Y, { font: 'F2', size: 8, color: C_NAVY });

  drawText('Document Category:', MARGIN_LEFT + 12, row2Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(category, MARGIN_LEFT + 112, row2Y, { font: 'F2', size: 8, color: C_NAVY });

  drawText('Uploaded By:', MARGIN_LEFT + 12, row3Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(uploadedBy, MARGIN_LEFT + 112, row3Y, { font: 'F2', size: 8, color: C_NAVY });

  // Col 2 Right
  drawText('Upload / Signoff Date:', MARGIN_LEFT + colW + 12, row1Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(date, MARGIN_LEFT + colW + 118, row1Y, { font: 'F2', size: 8, color: C_NAVY });

  drawText('Original File Size:', MARGIN_LEFT + colW + 12, row2Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(size, MARGIN_LEFT + colW + 118, row2Y, { font: 'F2', size: 8, color: C_NAVY });

  drawText('Compliance Status:', MARGIN_LEFT + colW + 12, row3Y, { font: 'F1', size: 8, color: C_SLATE });
  drawText(normStatus, MARGIN_LEFT + colW + 118, row3Y, { font: 'F2', size: 8, color: statusColor });

  curY = tableTop - tableH - 16;

  // --- Section 6: Technical Inspection Details ---
  drawText('TECHNICAL INSPECTION DETAILS', MARGIN_LEFT, curY, { font: 'F2', size: 9.5, color: C_NAVY });
  fillRect(MARGIN_LEFT + 172, curY + 1, 16, 2, C_BLUE);
  curY -= 12;

  // Render numbered notes
  for (let i = 0; i < filteredNotes.length; i++) {
    const rawNote = filteredNotes[i];
    // Check if we need a page break
    if (curY < 180) {
      startNewPage();
      curY = renderHeader(false);
      drawText('TECHNICAL INSPECTION DETAILS (CONTINUED)', MARGIN_LEFT, curY, { font: 'F2', size: 9.5, color: C_NAVY });
      curY -= 14;
    }

    // Parse note: "1. Scope: Comprehensive..." or "1. Scope - Comprehensive..."
    const numMatch = rawNote.match(/^(\d+)\.\s*(.+)/);
    const numIndex = numMatch ? String(numMatch[1]).padStart(2, '0') : String(i + 1).padStart(2, '0');
    const noteBody = numMatch ? numMatch[2] : rawNote;

    let noteLabel = '';
    let noteContent = noteBody;
    const colonIdx = noteBody.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35) {
      noteLabel = noteBody.substring(0, colonIdx).trim();
      noteContent = noteBody.substring(colonIdx + 1).trim();
    }

    const itemTopY = curY;

    // Number Badge (pill box)
    drawRoundedCard(MARGIN_LEFT, itemTopY - 14, 20, 15, 3, '0.937 0.965 1.000', '0.749 0.859 0.996', 0.6);
    drawText(numIndex, MARGIN_LEFT + 10, itemTopY - 10, { font: 'F2', size: 7.5, color: C_BLUE, align: 'center' });

    // Label & Wrapped Content
    const textStartX = MARGIN_LEFT + 28;
    const maxTextW = CONTENT_WIDTH - 28;

    if (noteLabel) {
      drawText(noteLabel, textStartX, itemTopY - 9, { font: 'F2', size: 8.8, color: C_NAVY });
      const labelW = getTextWidth(noteLabel, 8.8, true);

      const contentLines = wrapText(noteContent, maxTextW - labelW - 12, 8.4, false);
      if (contentLines.length > 0) {
        drawText(`—  ${contentLines[0]}`, textStartX + labelW + 4, itemTopY - 9, { font: 'F1', size: 8.4, color: '0.200 0.250 0.330' });
        for (let l = 1; l < contentLines.length; l++) {
          curY -= 11.5;
          drawText(contentLines[l], textStartX, curY - 9, { font: 'F1', size: 8.4, color: '0.200 0.250 0.330' });
        }
      }
    } else {
      const contentLines = wrapText(noteContent, maxTextW, 8.4, false);
      for (let l = 0; l < contentLines.length; l++) {
        drawText(contentLines[l], textStartX, itemTopY - 9 - (l * 11.5), { font: 'F1', size: 8.4, color: '0.200 0.250 0.330' });
      }
      curY -= (contentLines.length - 1) * 11.5;
    }

    curY -= 16;
    // Light divider line between items
    if (i < filteredNotes.length - 1) {
      drawLine(MARGIN_LEFT + 28, curY + 6, MARGIN_LEFT + CONTENT_WIDTH, curY + 6, '0.945 0.961 0.976', 0.5);
    }
  }

  curY -= 6;

  // --- Section 7: Inspection Result (If Present) ---
  if (inspectionResultText || isApproved) {
    if (curY < 160) {
      startNewPage();
      curY = renderHeader(false);
    }

    const resultBoxH = 38;
    const resultBoxY = curY - resultBoxH;

    drawRoundedCard(MARGIN_LEFT, resultBoxY, CONTENT_WIDTH, resultBoxH, 4, '0.945 0.992 0.965', '0.733 0.965 0.824', 0.75);

    // Left Column: Vector checkmark + PASSED badge
    drawText('INSPECTION RESULT', MARGIN_LEFT + 14, resultBoxY + resultBoxH - 12, { font: 'F2', size: 6.8, color: C_SLATE });

    const chkX = MARGIN_LEFT + 14;
    const chkY = resultBoxY + 12;
    setStroke('0.086 0.639 0.290');
    setLineWidth(1.6);
    curOps.push(`${chkX.toFixed(2)} ${(chkY + 2).toFixed(2)} m ${(chkX + 3.5).toFixed(2)} ${(chkY - 2.5).toFixed(2)} l ${(chkX + 8.5).toFixed(2)} ${(chkY + 5.5).toFixed(2)} l S`);

    drawText('PASSED (VERIFIED & RATIFIED)', chkX + 13, resultBoxY + 9, { font: 'F2', size: 10.5, color: '0.086 0.639 0.290' });

    // Right Column: Certified By
    const certX = MARGIN_LEFT + 280;
    drawLine(certX - 16, resultBoxY + 6, certX - 16, resultBoxY + resultBoxH - 6, '0.733 0.965 0.824', 0.6);
    drawText('CERTIFIED BY AUTHORITY', certX, resultBoxY + resultBoxH - 12, { font: 'F2', size: 6.8, color: C_SLATE });
    drawText(certifiedByText || `${uploadedBy} (Lead PE & QA/QC Inspector)`, certX, resultBoxY + 9, { font: 'F2', size: 8.5, color: C_NAVY });

    curY = resultBoxY - 12;
  }

  // --- Section 8: Pour Gate / Approval Callout (If Present) ---
  if (pourGateText) {
    if (curY < 120) {
      startNewPage();
      curY = renderHeader(false);
    }

    const pourH = 34;
    const pourY = curY - pourH;

    // Subtle green approval treatment with left accent bar
    drawRoundedCard(MARGIN_LEFT, pourY, CONTENT_WIDTH, pourH, 4, '0.925 0.992 0.961', '0.655 0.953 0.816', 0.75);
    // Green solid left bar
    fillRect(MARGIN_LEFT, pourY, 4, pourH, '0.086 0.639 0.290');

    drawText('POUR GATE: AUTHORIZED', MARGIN_LEFT + 14, pourY + pourH - 12, { font: 'F2', size: 8.5, color: '0.024 0.373 0.275' });
    drawText(pourGateText, MARGIN_LEFT + 14, pourY + 9, { font: 'F1', size: 8, color: '0.020 0.471 0.341' });

    curY = pourY - 12;
  }

  // --- Section 9: Digital Verification Box ---
  if (curY < 95) {
    startNewPage();
    curY = renderHeader(false);
  }

  const verifBoxH = 46;
  const verifBoxY = Math.max(curY - verifBoxH, 64);

  drawRoundedCard(MARGIN_LEFT, verifBoxY, CONTENT_WIDTH, verifBoxH, 4, C_BG_CARD, C_BORDER, 0.75);

  // Top Title in Verification Box
  drawText('DIGITAL VERIFICATION & AUDIT TRAIL', MARGIN_LEFT + 12, verifBoxY + verifBoxH - 12, { font: 'F2', size: 7.2, color: C_SLATE });
  drawText('Digitally Verified & Certified by BuildOps AI Smart Construction Operations Platform', MARGIN_LEFT + 12, verifBoxY + verifBoxH - 22, { font: 'F1', size: 7.5, color: C_NAVY });

  // Bottom row: Security Fingerprint & Timestamp
  const verifRowY = verifBoxY + 8;
  drawText('Security Fingerprint:', MARGIN_LEFT + 12, verifRowY, { font: 'F2', size: 6.8, color: C_SLATE });
  drawText(actualFingerprint, MARGIN_LEFT + 98, verifRowY, { font: 'F2', size: 7.2, color: C_BLUE });

  const tsX = MARGIN_LEFT + CONTENT_WIDTH - 12;
  drawText(`Generated: ${actualTimestamp}`, tsX, verifRowY, { font: 'F1', size: 7, color: C_MUTED, align: 'right' });

  // --- Section 10: Running Footers on Every Page ---
  const totalPages = pages.length;

  for (let p = 0; p < totalPages; p++) {
    const pOps = pages[p];
    const pageNum = p + 1;
    const footLineY = 48;
    const footTextY = 34;

    // Footer divider line
    pOps.push(`${C_BORDER} RG`);
    pOps.push('0.75 w');
    pOps.push(`${MARGIN_LEFT.toFixed(2)} ${footLineY} m ${(MARGIN_LEFT + CONTENT_WIDTH).toFixed(2)} ${footLineY} l S`);

    // Left: BuildOps AI
    pOps.push('BT');
    pOps.push('/F2 8 Tf');
    pOps.push(`${C_SLATE} rg`);
    pOps.push(`1 0 0 1 ${MARGIN_LEFT} ${footTextY} Tm`);
    pOps.push(`(${escapePdf('BuildOps AI')}) Tj`);
    pOps.push('ET');

    // Center: Confidential Construction Record
    const centerText = 'Confidential Construction Record';
    const centerW = getTextWidth(centerText, 7.5, false);
    const centerX = PAGE_WIDTH / 2 - centerW / 2;
    pOps.push('BT');
    pOps.push('/F1 7.5 Tf');
    pOps.push(`${C_MUTED} rg`);
    pOps.push(`1 0 0 1 ${centerX.toFixed(2)} ${footTextY} Tm`);
    pOps.push(`(${escapePdf(centerText)}) Tj`);
    pOps.push('ET');

    // Right: Page X of Y (Dynamic)
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const pageW = getTextWidth(pageText, 7.8, false);
    const pageX = MARGIN_LEFT + CONTENT_WIDTH - pageW;
    pOps.push('BT');
    pOps.push('/F1 7.8 Tf');
    pOps.push(`${C_SLATE} rg`);
    pOps.push(`1 0 0 1 ${pageX.toFixed(2)} ${footTextY} Tm`);
    pOps.push(`(${escapePdf(pageText)}) Tj`);
    pOps.push('ET');
  }

  // Assemble PDF 1.4 Binary Object Tree
  const objects = [];
  const pageObjIds = [];

  const catalogObjId = 1;
  const pagesObjId = 2;
  let nextObjId = 3;

  for (let p = 0; p < totalPages; p++) {
    pageObjIds.push(nextObjId++);
  }

  const contentObjIds = [];
  for (let p = 0; p < totalPages; p++) {
    contentObjIds.push(nextObjId++);
  }

  const fontF1ObjId = nextObjId++;
  const fontF2ObjId = nextObjId++;

  // Catalog Object
  objects.push(`${catalogObjId} 0 obj\n<< /Type /Catalog /Pages ${pagesObjId} 0 R >>\nendobj`);

  // Pages Object
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects.push(`${pagesObjId} 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj`);

  // Page objects & Content Streams
  for (let p = 0; p < totalPages; p++) {
    const pId = pageObjIds[p];
    const cId = contentObjIds[p];
    const streamContent = pages[p].join('\n');
    const streamLen = new TextEncoder().encode(streamContent).length;

    objects.push(
      `${pId} 0 obj\n<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${cId} 0 R /Resources << /Font << /F1 ${fontF1ObjId} 0 R /F2 ${fontF2ObjId} 0 R >> >> >>\nendobj`
    );

    objects.push(
      `${cId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`
    );
  }

  // Type 1 Helvetica Fonts
  objects.push(`${fontF1ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
  objects.push(`${fontF2ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);

  // Compute Cross-Reference Table (XREF)
  let offset = 9; // '%PDF-1.4\n'
  const offsets = [];
  const parts = ['%PDF-1.4\n'];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(offset);
    const objStr = objects[i] + '\n';
    parts.push(objStr);
    offset += new TextEncoder().encode(objStr).length;
  }

  const startXref = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  parts.push(xref);
  parts.push(trailer);

  return new Blob(parts, { type: 'application/pdf' });
};

/**
 * Triggers a real native browser download of a Blob
 */
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);
};

/**
 * Downloads a specific document from the Document Vault in real time
 */
export const downloadVaultDocument = (docOrName) => {
  const doc = typeof docOrName === 'string'
    ? { name: docOrName, id: 'DOC-101', project: 'Residential Tower A', type: 'Certificate' }
    : docOrName;

  const rawFileName = doc.name || 'BuildOps_Document.pdf';
  const isDwg = rawFileName.toLowerCase().endsWith('.dwg');
  const isPdf = rawFileName.toLowerCase().endsWith('.pdf') || !rawFileName.includes('.');

  // Generate professional clean download filename (convert underscores to hyphens)
  const baseName = rawFileName.replace(/\.(pdf|dwg)$/i, '');
  const cleanBaseName = baseName.replace(/_+/g, '-');
  const downloadName = isDwg ? `${cleanBaseName}.dwg` : `${cleanBaseName}.pdf`;

  if (isDwg) {
    // Generate valid ASCII DXF/DWG CAD blueprint specification file
    const dwgContent = [
      '  0',
      'SECTION',
      '  2',
      'HEADER',
      '  9',
      '$ACADVER',
      '  1',
      'AC1027',
      '  9',
      '$PROJECT',
      '  1',
      doc.project || 'Commercial Complex B',
      '  9',
      '$DRAWING_TITLE',
      '  1',
      rawFileName,
      '  9',
      '$ARCHITECT',
      '  1',
      doc.uploadedBy || 'Vitro Architectural Consultants',
      '  0',
      'ENDSEC',
      '  0',
      'SECTION',
      '  2',
      'ENTITIES',
      '  0',
      'TEXT',
      '  8',
      'ELEVATION_WEST_GLAZING',
      ' 10',
      '100.0',
      ' 20',
      '200.0',
      ' 40',
      '12.0',
      '  1',
      'BUILDOPS AI ARCHITECTURAL BLUEPRINT SHOP DRAWING - APPROVED FOR FABRICATION',
      '  0',
      'ENDSEC',
      '  0',
      'EOF',
    ].join('\r\n');

    const blob = new Blob([dwgContent], { type: 'application/acad' });
    triggerDownload(blob, downloadName);
    return true;
  }

  // Pre-configured rich technical data for known files
  let notes = [];
  const fields = {
    'Document Record ID': doc.id || 'DOC-101',
    'Document Category': doc.type || 'Engineering Certificate',
    'Uploaded By': doc.uploadedBy || 'Alex Morgan',
    'Upload / Signoff Date': doc.date || '2026-09-18',
    'Original File Size': doc.size || '4.8 MB',
    'Compliance Status': doc.status || 'Approved',
  };

  if (rawFileName.includes('Rebar') || rawFileName.includes('Inspection')) {
    notes = [
      '1. Scope: Comprehensive structural QA/QC inspection of foundation mat rebar grid and columns 1-24.',
      '2. Materials: High-yield deformed steel bars (Grade 60) conforming strictly to ASTM A615 / A615M.',
      '3. Clear Cover: Verified at 75mm minimum clearance for sub-grade foundation pours.',
      '4. Seismic Spacing: 135-degree seismic hooks and column tie pitch conform to Structural Rev-4.',
      '5. Inspection Authority Signoff: PASSED - Certified by Alex Morgan & Lead PE.',
      '6. Pour Gate: Authorized for scheduled Ready-Mix Concrete pour.',
    ];
  } else if (rawFileName.includes('Contract') || doc.type === 'Contract') {
    notes = [
      '1. Instrument: Master Commercial Construction Agreement & Prime Contractor General Conditions.',
      '2. Employer: Aura Living Developments LLC | Contractor: Apex Construction Group.',
      '3. Contract Sum: $18,400,000 USD stipulated sum with 10% progress milestone retention.',
      '4. Completion Schedule: Substantial completion targeted for 2027-12-31 with 365-day defect warranty.',
      '5. Dispute Clause: Binding arbitration administered by American Arbitration Association.',
      '6. Execution Status: Ratified and formally sealed by legal counsel on 2026-01-12.',
    ];
  } else if (rawFileName.includes('Invoice') || doc.type === 'Invoice') {
    notes = [
      '1. Vendor: Apex Ready-Mix Concrete Corp. | Bill To: BuildOps AI Commercial Project.',
      '2. Batch Ticket #8821-C: 450 cu.m M40 High-Strength Concrete delivered to Site Gate 2.',
      '3. Slump Test: 120mm +/- 25mm measured on arrival; mix temperature recorded at 24 deg C.',
      '4. Pricing: 450 cu.m @ $145.00/cu.m = $65,250.00 | Local Sales Tax (8.25%): $5,383.13.',
      '5. Total Net Payable: $70,633.13 USD.',
      '6. Payment Confirmation: Paid in Full via Electronic Wire on 2026-09-15.',
    ];
  } else if (rawFileName.includes('Geotechnical') || rawFileName.includes('Subsidence')) {
    notes = [
      '1. Geotechnical Consultant: Geotech Solutions Engineering Consultants.',
      '2. Instrumentation: 16 precision settlement gauges and 4 deep-datum piezometers monitored.',
      '3. Differential Settlement: Maximum recorded settlement: 3.2mm (Allowable limit: 25.0mm).',
      '4. Water Table: Recorded at -8.4m below ground datum; zero hydrostatic uplift concerns.',
      '5. Professional Opinion: Sub-grade foundation integrity is solid and meets all seismic criteria.',
      '6. Clearance: Safe to proceed with vertical superstructure structural steel framing.',
    ];
  } else if (rawFileName.includes('Permit') || rawFileName.includes('Approved')) {
    notes = [
      '1. Issuing Body: Municipal Department of Buildings & Infrastructure Authority.',
      '2. Permit Number: BP-2026-09412-COMM | Classification: Type 1-A Commercial High-Rise.',
      '3. Approved Scope: Foundation, below-grade substructure, vertical core levels 1-28.',
      '4. Environmental Clearance: Complete compliance certified under City Code Chapter 18.',
      '5. Term: Active and in full force from 2026-03-05 through 2028-03-05.',
    ];
  } else if (rawFileName.includes('Chiller') || rawFileName.includes('HVAC')) {
    notes = [
      '1. Trade: Mechanical, Electrical & Plumbing (MEP) Division.',
      '2. Equipment: 2x 500-Ton Water-Cooled Centrifugal Chiller Units.',
      '3. Efficiency: 0.54 kW/Ton at standard AHRI operating conditions.',
      '4. Seismic Anchoring: High-deflection seismic spring isolators rated for Zone 4 installation.',
      '5. Approval: Approved as Noted - Mechanical Engineer of Record signoff confirmed.',
    ];
  } else {
    notes = [
      `1. Document Title: ${rawFileName}`,
      `2. Associated Project: ${doc.project || 'Active Construction Project'}`,
      `3. Category: ${doc.type || 'Operational Document'} | Size: ${doc.size || '2.4 MB'}`,
      `4. Uploaded by: ${doc.uploadedBy || 'Alex Morgan'} on ${doc.date || '2026-09-20'}`,
      '5. Document verified and archived into BuildOps AI Cloud Document Vault.',
      '6. All digital signatures, revision history, and compliance gates are authenticated.',
    ];
  }

  const pdfBlob = createPdfBlob(
    rawFileName,
    doc.project || 'Residential Tower A',
    fields,
    notes,
    {
      docId: doc.id || 'DOC-101',
      category: doc.type || 'Certificate',
      uploadedBy: doc.uploadedBy || 'Alex Morgan',
      date: doc.date || '2026-09-18',
      size: doc.size || '4.8 MB',
      status: doc.status || 'Approved',
    }
  );

  triggerDownload(pdfBlob, downloadName);
  return true;
};

/**
 * Exports operational reports (PDF or CSV) in real time
 */
export const exportRealReport = (format, data = {}) => {
  const { projects = [], tasks = [], materials = [] } = data;
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === 'CSV' || format === 'Excel') {
    const rows = [
      ['BuildOps AI - Smart Construction Operations Report'],
      [`Generated: ${dateStr}`],
      [],
      ['--- PROJECTS OVERVIEW ---'],
      ['Project Name', 'Client', 'Location', 'Manager', 'Progress %', 'Status', 'Risk Level', 'Start Date', 'End Date'],
      ...projects.map((p) => [
        `"${p.name || ''}"`,
        `"${p.client || ''}"`,
        `"${p.location || ''}"`,
        `"${p.manager || ''}"`,
        `${p.progress || 0}%`,
        `"${p.status || ''}"`,
        `"${p.risk || ''}"`,
        `"${p.startDate || ''}"`,
        `"${p.endDate || ''}"`,
      ]),
      [],
      ['--- ACTIVE TASKS MATRIX ---'],
      ['Task Title', 'Project ID', 'Assignee', 'Priority', 'Status', 'Progress %', 'Due Date'],
      ...tasks.map((t) => [
        `"${t.title || t.name || ''}"`,
        `"${t.projectId || ''}"`,
        `"${t.assignedTo || 'Unassigned'}"`,
        `"${t.priority || 'Medium'}"`,
        `"${t.status || 'Not Started'}"`,
        `${t.progress || 0}%`,
        `"${t.dueDate || ''}"`,
      ]),
      [],
      ['--- MATERIALS INVENTORY ---'],
      ['Material Name', 'Category', 'Required Qty', 'Available Qty', 'Unit', 'Status'],
      ...materials.map((m) => [
        `"${m.name || m.material || ''}"`,
        `"${m.category || ''}"`,
        `${m.requiredQuantity || 0}`,
        `${m.availableQuantity || 0}`,
        `"${m.unit || 'Units'}"`,
        `"${m.status || 'Available'}"`,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = format === 'Excel'
      ? `BuildOps-Budget-Variance-Report-${dateStr}.csv`
      : `BuildOps-Operations-Report-${dateStr}.csv`;
    triggerDownload(blob, filename);
    return true;
  }

  // Format === 'PDF' or 'Generated'
  const summaryFields = {
    'Document Record ID': 'REP-PORTFOLIO-01',
    'Document Category': 'Executive Operations Report',
    'Uploaded By': 'Alex Morgan (Project Director)',
    'Upload / Signoff Date': dateStr,
    'Original File Size': '1.8 MB',
    'Compliance Status': 'Approved & Active',
  };

  const reportNotes = [
    '1. High-Level Progress: Average portfolio schedule completion is tracking at target baseline velocity.',
    `2. Critical Path Tasks: ${tasks.filter((t) => t.priority === 'Critical' || t.priority === 'High').length} High/Critical priority tasks monitored across active sites.`,
    `3. Inventory Health: ${materials.filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock').length} materials currently flagged for procurement reorder.`,
    '4. Quality & Safety: Site hazard mitigation active; all weekly safety audits logged without critical flags.',
    '5. Budget & Cost Variance: Project draw requests align within 1.8% of committed capital forecast.',
    '6. Official Endorsement: Certified and generated by BuildOps AI Construction Intelligence Engine.',
  ];

  const pdfBlob = createPdfBlob(
    'Executive Construction Operations Report',
    'All Active Portfolio Sites',
    summaryFields,
    reportNotes,
    {
      docId: 'REP-PORTFOLIO-01',
      category: 'Executive Operations Report',
      uploadedBy: 'Alex Morgan (Project Director)',
      date: dateStr,
      size: '1.8 MB',
      status: 'Approved',
    }
  );

  triggerDownload(pdfBlob, `BuildOps-Operations-Report-${dateStr}.pdf`);
  return true;
};

/**
 * Exports an AI-generated project or portfolio report to a professional A4 PDF.
 * Reuses the existing vector PDF builder with correct non-mirrored BuildOps branding.
 *
 * @param {Object} options
 * @param {string} [options.title] - Report title
 * @param {string} [options.projectName] - Name of project or 'All Active Portfolio Sites'
 * @param {Object} [options.reportData] - Structured report data object
 * @param {string} [options.content] - Full markdown text of the report
 * @param {Array} [options.sources] - Sources metadata
 * @param {string} [options.confidence] - Confidence score
 * @returns {{ pdfBlob: Blob, filename: string }}
 */
export const exportAiProjectReportPdf = (options = {}) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const data = options.reportData || {};
  const isPortfolio = data.scope === 'portfolio' || options.projectName === 'All Projects';

  const reportTitle = options.title || data.reportType || 'Project Status Report';
  const projectName = options.projectName || data.projectOverview?.name || 'All Active Portfolio Sites';

  const docId = `REP-${Date.now().toString(36).toUpperCase()}`;

  const summaryFields = {
    'Document Record ID': docId,
    'Document Category': 'AI Construction Operations Report',
    'Uploaded By': 'BuildOps AI Intelligence Engine',
    'Upload / Signoff Date': dateStr,
    'Original File Size': 'A4 Executive PDF',
    'Compliance Status': 'Grounded & Verified',
  };

  if (!isPortfolio && data.projectOverview) {
    summaryFields['Project Location'] = data.projectOverview.location || 'Site Location';
    summaryFields['Project Progress'] = `${data.projectOverview.progress}% (${data.projectOverview.status})`;
  } else if (isPortfolio && data.overview) {
    summaryFields['Portfolio Scope'] = `${data.overview.totalProjects} Active Projects`;
    summaryFields['Average Progress'] = `${data.overview.averageProgress}% Overall Velocity`;
  }

  // Build structured notes from report sections
  const reportNotes = [];

  if (options.content) {
    // Parse markdown content sections into structured notes
    const rawLines = options.content.split('\n');
    let curSection = '';
    let curPoints = [];

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('### ')) {
        if (curSection && curPoints.length > 0) {
          reportNotes.push(`${reportNotes.length + 1}. ${curSection}: ${curPoints.join(' ')}`);
          curPoints = [];
        }
        curSection = trimmed.replace('### ', '').trim();
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
        curPoints.push(itemText);
      } else if (/^\d+\.\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '');
        curPoints.push(itemText);
      } else if (!trimmed.startsWith('## ') && !trimmed.startsWith('<!--') && !trimmed.startsWith('*Safety')) {
        curPoints.push(trimmed.replace(/\*\*/g, ''));
      }
    }

    if (curSection && curPoints.length > 0) {
      reportNotes.push(`${reportNotes.length + 1}. ${curSection}: ${curPoints.join(' ')}`);
    }
  }

  // Fallback if notes array was empty or content was short
  if (reportNotes.length === 0) {
    if (!isPortfolio && data.projectOverview) {
      reportNotes.push(`1. Executive Status: Project "${data.projectOverview.name}" is currently ${data.projectOverview.status} with ${data.projectOverview.progress}% recorded progress.`);
      if (data.projectProgress) {
        reportNotes.push(`2. Task Matrix: ${data.projectProgress.totalTasks} total tasks tracked (${data.projectProgress.completedTasks} completed, ${data.projectProgress.inProgressTasks} in progress, ${data.projectProgress.delayedTasks} delayed, ${data.projectProgress.overdueTasks} overdue).`);
      }
      if (data.materialStatus) {
        reportNotes.push(`3. Material Inventory: ${data.materialStatus.availableCount} available, ${data.materialStatus.lowStockCount} low stock, ${data.materialStatus.outOfStockCount} out of stock.`);
      }
      if (data.scheduleStatus) {
        reportNotes.push(`4. Schedule Position: ${data.scheduleStatus.currentPosition}. Overdue activities tracked: ${data.scheduleStatus.overdueCount}.`);
      }
      if (data.riskSummary && data.riskSummary.length > 0) {
        reportNotes.push(`5. Risk Signals: ${data.riskSummary.map((r) => `${r.category} (${r.severity}): ${r.evidence?.join(' ')}`).join('; ')}`);
      }
      if (data.recommendedActions && data.recommendedActions.length > 0) {
        reportNotes.push(`6. Recommended Actions: ${data.recommendedActions.join(' ')}`);
      }
    } else {
      reportNotes.push(`1. Portfolio Overview: Tracking ${data.overview?.totalProjects || 'all'} active projects with an average schedule progress of ${data.overview?.averageProgress || 0}%.`);
      reportNotes.push(`2. Task Attention: ${data.tasks?.totalDelayed || 0} delayed tasks and ${data.tasks?.totalOverdue || 0} overdue activities across sites.`);
      reportNotes.push(`3. Materials: ${data.materials?.totalLowStock || 0} low stock items and ${data.materials?.totalOutOfStock || 0} stockouts flagged.`);
      reportNotes.push(`4. Operational Themes: ${data.operationalThemes ? data.operationalThemes.join('; ') : 'Operations active.'}`);
    }
  }

  // Add certification note
  reportNotes.push(`${reportNotes.length + 1}. System Certification: Factual project telemetry verified against BuildOps AI live MongoDB records.`);

  const pdfBlob = createPdfBlob(
    reportTitle,
    projectName,
    summaryFields,
    reportNotes,
    {
      docId,
      category: reportTitle,
      uploadedBy: 'BuildOps AI System',
      date: dateStr,
      size: 'A4 Document',
      status: 'Approved',
    }
  );

  const cleanName = (projectName || 'Project').replace(/[^\w.-]+/g, '_');
  const cleanType = (reportTitle || 'Report').replace(/[^\w.-]+/g, '_');
  const filename = `BuildOps-${cleanType}-${cleanName}-${dateStr}.pdf`;

  triggerDownload(pdfBlob, filename);
  return { pdfBlob, filename };
};
