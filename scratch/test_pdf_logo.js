import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions matching fileDownloader.js
const getCharWidth = (char, isBold = false) => {
  const code = char.charCodeAt(0);
  if (char === ' ') return 278;
  if (code >= 48 && code <= 57) return isBold ? 556 : 500;
  if (code >= 65 && code <= 90) {
    if ('I'.includes(char)) return 278;
    if ('MW'.includes(char)) return 833;
    if ('CGOQ'.includes(char)) return isBold ? 722 : 667;
    return isBold ? 722 : 667;
  }
  if (code >= 97 && code <= 122) {
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

const escapePdf = (text) => {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
};

// Generate test PDF with the upgraded logo
function generateTestPdf() {
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 48;
  const MARGIN_RIGHT = 48;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  const C_NAVY = '0.059 0.090 0.165';
  const C_SLATE = '0.392 0.455 0.545';
  const C_MUTED = '0.580 0.639 0.722';
  const C_BLUE = '0.086 0.467 0.824';
  const C_ORANGE = '1.000 0.416 0.000';
  const C_WHITE = '1.000 1.000 1.000';

  const curOps = [];
  const setFill = (c) => curOps.push(`${c} rg`);
  const setStroke = (c) => curOps.push(`${c} RG`);
  const setLineWidth = (w) => curOps.push(`${w} w`);

  const fillRect = (x, y, w, h, c) => {
    setFill(c);
    curOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
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

  const drawRoundedCard = (x, y, w, h, r, fillC, strokeC, lineW = 0.75) => {
    const k = 0.55228475 * r;
    const x0 = x, x1 = x + r, x2 = x + w - r, x3 = x + w;
    const y0 = y, y1 = y + r, y2 = y + h - r, y3 = y + h;

    setFill(fillC);
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

  // Top header rendering
  const topY = 788;
  const baseY = topY - 24; // Flat ground baseline at 764 pt

  // Building 1 (Left: Blue, medium height: 18.8 pt)
  drawRoundedCard(MARGIN_LEFT, baseY, 6.8, 18.8, 1.2, C_BLUE, null);
  // Windows on Building 1 (white 2.4 x 2.4 pt)
  fillRect(MARGIN_LEFT + 2.2, baseY + 12.0, 2.4, 2.4, C_WHITE);
  fillRect(MARGIN_LEFT + 2.2, baseY + 6.0, 2.4, 2.4, C_WHITE);

  // Building 2 (Center: Orange, tallest skyscraper: 24.0 pt)
  drawRoundedCard(MARGIN_LEFT + 9.35, baseY, 6.8, 24.0, 1.2, C_ORANGE, null);
  // Windows on Building 2 (white 2.4 x 2.4 pt)
  fillRect(MARGIN_LEFT + 11.55, baseY + 17.0, 2.4, 2.4, C_WHITE);
  fillRect(MARGIN_LEFT + 11.55, baseY + 11.5, 2.4, 2.4, C_WHITE);
  fillRect(MARGIN_LEFT + 11.55, baseY + 6.0, 2.4, 2.4, C_WHITE);

  // Building 3 (Right: Blue, compact height: 15.3 pt)
  drawRoundedCard(MARGIN_LEFT + 18.7, baseY, 6.8, 15.3, 1.2, C_BLUE, null);
  // Windows on Building 3 (white 2.4 x 2.4 pt)
  fillRect(MARGIN_LEFT + 20.9, baseY + 9.5, 2.4, 2.4, C_WHITE);
  fillRect(MARGIN_LEFT + 20.9, baseY + 4.5, 2.4, 2.4, C_WHITE);

  // Brand Name & Subtitle
  const textX = MARGIN_LEFT + 33;
  const buildOpsWidth = getTextWidth('BUILDOPS ', 13.5, true);
  drawText('BUILDOPS ', textX, topY - 10.5, { font: 'F2', size: 13.5, color: C_NAVY });
  drawText('AI', textX + buildOpsWidth, topY - 10.5, { font: 'F2', size: 13.5, color: C_ORANGE });
  drawText('AI-POWERED CONSTRUCTION OPERATIONS', textX, topY - 21.5, { font: 'F2', size: 6.8, color: C_MUTED });

  // Right Header side
  drawText('DOCUMENT TYPE', MARGIN_LEFT + CONTENT_WIDTH, topY - 10.5, { font: 'F2', size: 6.8, color: C_MUTED, align: 'right' });
  drawText('EXECUTIVE OPERATIONS REPORT', MARGIN_LEFT + CONTENT_WIDTH, topY - 22, { font: 'F2', size: 9.5, color: C_NAVY, align: 'right' });

  // Thin blue/orange accent line below header
  const lineY = topY - 30;
  fillRect(MARGIN_LEFT, lineY, CONTENT_WIDTH, 2, C_BLUE);
  fillRect(MARGIN_LEFT, lineY, 56, 2, C_ORANGE);

  // Sample title
  drawText('EXECUTIVE CONSTRUCTION OPERATIONS REPORT', MARGIN_LEFT, lineY - 22, { font: 'F2', size: 15, color: C_NAVY });

  // Build PDF Objects
  const streamContent = curOps.join('\n');
  const streamLen = Buffer.byteLength(streamContent, 'latin1');

  const pdf = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>`,
    'endobj',
    '4 0 obj',
    `<< /Length ${streamLen} >>`,
    'stream',
    streamContent,
    'endstream',
    'endobj',
    'xref',
    '0 5',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000300 00000 n ',
    'trailer',
    '<< /Size 5 /Root 1 0 R >>',
    'startxref',
    '450',
    '%%EOF',
  ].join('\n');

  const outputPath = path.join(__dirname, 'test_output_logo.pdf');
  fs.writeFileSync(outputPath, pdf, 'latin1');
  console.log('Test PDF generated successfully at:', outputPath);
}

generateTestPdf();
