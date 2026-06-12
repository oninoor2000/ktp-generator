/**
 * Browser-only PDF export helper.
 *
 * Uses pdf-lib to stamp generated KTP/KTA data onto the card template PNG.
 * Each card gets its own page at the PNG's natural aspect ratio.
 *
 * Must not be imported server-side (uses fetch/document/URL).
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import type { FieldConfig, KTAGeneratedData, KTPGeneratedData } from "~/features/generator/domain/types";
import { DEFAULT_KTP_POSITION_CONFIG, DEFAULT_KTA_POSITION_CONFIG } from "~/features/generator/domain/position";
import { KTP_TEMPLATE_PATH, KTA_TEMPLATE_PATH } from "~/features/generator/domain/constants";
import type { CardType } from "~/features/generator/domain/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPLATE_WIDTH = 650;   // fixed page width in points
const TEMPLATE_HEIGHT = 410;  // fixed page height in points
const MANUAL_Y_OFFSET = -15;  // vertical alignment correction in points

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PdfExportProgressCallback = (done: number, total: number) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Convert a percentage-based x position (0–100) to an absolute PDF coordinate.
 * The PDF coordinate system has origin at bottom-left.
 *
 * Always uses TEMPLATE_WIDTH (650) and TEMPLATE_HEIGHT (410) as the reference
 * frame, regardless of any additional arguments passed. The extra positional
 * parameters are accepted for backwards-compatibility with existing call sites
 * but are intentionally ignored.
 *
 * @param xPercent - 0–100% of page width
 * @param yPercent - 0–100% of page height (measured from top of image)
 * @param _ignoredWidth - ignored; kept for call-site compatibility
 * @param _ignoredHeight - ignored; kept for call-site compatibility
 * @param align - text alignment
 * @param textWidth - pre-measured text width in points (for center/right align)
 */
export function percentToCoords(
  xPercent: number,
  yPercent: number,
  _ignoredWidthOrAlign?: number | "left" | "center" | "right",
  _ignoredHeightOrTextWidth?: number,
  align: "left" | "center" | "right" = "left",
  textWidth = 0,
): { x: number; y: number } {
  const resolvedAlign =
    typeof _ignoredWidthOrAlign === "string" ? _ignoredWidthOrAlign : align;
  const resolvedTextWidth =
    typeof _ignoredWidthOrAlign === "string"
      ? (_ignoredHeightOrTextWidth ?? 0)
      : textWidth;

  const absX = (xPercent / 100) * TEMPLATE_WIDTH;
  // yPercent is measured from top; pdf-lib measures from bottom.
  // MANUAL_Y_OFFSET corrects for a known vertical alignment shift.
  const absY = TEMPLATE_HEIGHT - (yPercent / 100) * TEMPLATE_HEIGHT + MANUAL_Y_OFFSET;

  let x = absX;
  if (resolvedAlign === "center") x = absX - resolvedTextWidth / 2;
  else if (resolvedAlign === "right") x = absX - resolvedTextWidth;

  return { x, y: absY };
}

async function fetchTemplateBytes(path: string): Promise<Uint8Array> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load template image: ${path} (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// ---------------------------------------------------------------------------
// Core: render a single card page
// ---------------------------------------------------------------------------

async function drawCardPage(
  pdfDoc: PDFDocument,
  templateImageBytes: Uint8Array,
  fields: Record<string, { config: FieldConfig; value: string }>,
): Promise<void> {
  // Embed PNG template
  const templateImage = await pdfDoc.embedPng(templateImageBytes);

  // Use fixed dimensions — do NOT use templateImage.scale(1)
  const page = pdfDoc.addPage([TEMPLATE_WIDTH, TEMPLATE_HEIGHT]);
  page.drawImage(templateImage, { x: 0, y: 0, width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT });

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const { config, value } of Object.values(fields)) {
    if (!config.enabled || !value) continue;

    const { position, style } = config;
    const font = style.fontWeight === "bold" ? boldFont : regularFont;
    const fontSize = style.fontSize;
    const { r, g, b } = hexToRgb(style.color);

    const textWidth = font.widthOfTextAtSize(value, fontSize);
    const { x, y } = percentToCoords(
      position.x,
      position.y,
      TEMPLATE_WIDTH,
      TEMPLATE_HEIGHT,
      position.align,
      textWidth,
    );

    page.drawText(value, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  }
}

// ---------------------------------------------------------------------------
// KTP export
// ---------------------------------------------------------------------------

async function exportKtpPdf(
  rows: KTPGeneratedData[],
  onProgress?: PdfExportProgressCallback,
): Promise<Uint8Array> {
  const templateBytes = await fetchTemplateBytes(KTP_TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.create();
  const config = DEFAULT_KTP_POSITION_CONFIG;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const fields: Record<string, { config: FieldConfig; value: string }> = {
      province: { config: config.province, value: `PROVINSI ${row.province}` },
      city: { config: config.city, value: row.city },
      nik: { config: config.nik, value: row.nik },
      name: { config: config.name, value: row.name },
      birthDatePlace: { config: config.birthDatePlace, value: row.birthDatePlace },
      gender: { config: config.gender, value: row.gender },
      address: { config: config.address, value: row.address },
      rtRw: { config: config.rtRw, value: row.rtRw },
      village: { config: config.village, value: row.village },
      district: { config: config.district, value: row.district },
      religion: { config: config.religion, value: row.religion },
      maritalStatus: { config: config.maritalStatus, value: row.maritalStatus },
      occupation: { config: config.occupation, value: row.occupation },
      bloodType: { config: config.bloodType, value: row.bloodType },
      nationality: { config: config.nationality, value: "WNI" },
      validUntil: { config: config.validUntil, value: "SEUMUR HIDUP" },
    };

    await drawCardPage(pdfDoc, templateBytes, fields);
    onProgress?.(i + 1, rows.length);
  }

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// KTA export
// ---------------------------------------------------------------------------

async function exportKtaPdf(
  rows: KTAGeneratedData[],
  onProgress?: PdfExportProgressCallback,
): Promise<Uint8Array> {
  const templateBytes = await fetchTemplateBytes(KTA_TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.create();
  const config = DEFAULT_KTA_POSITION_CONFIG;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const fields: Record<string, { config: FieldConfig; value: string }> = {
      province: { config: config.province, value: `PROVINSI ${row.province}` },
      city: { config: config.city, value: row.city },
      nik: { config: config.nik, value: row.nik },
      name: { config: config.name, value: row.name },
      birthDatePlace: { config: config.birthDatePlace, value: row.birthDatePlace },
      gender: { config: config.gender, value: row.gender },
      familyCertificateNumber: { config: config.familyCertificateNumber, value: row.familyCertificateNumber },
      headFamilyName: { config: config.headFamilyName, value: row.headFamilyName },
      birthCertificateNumber: { config: config.birthCertificateNumber, value: row.birthCertificateNumber },
      religion: { config: config.religion, value: row.religion },
      nationality: { config: config.nationality, value: "WNI" },
      address: { config: config.address, value: row.address },
      rtRw: { config: config.rtRw, value: row.rtRw },
      village: { config: config.village, value: row.village },
      district: { config: config.district, value: row.district },
      validityPeriod: { config: config.validityPeriod, value: row.validityPeriod },
      bloodType: { config: config.bloodType, value: row.bloodType },
    };

    await drawCardPage(pdfDoc, templateBytes, fields);
    onProgress?.(i + 1, rows.length);
  }

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Export generated rows to a multi-page PDF and trigger browser download.
 *
 * File naming:
 * - KTP: `KTP_Data_<count>_yyyy-mm-dd.pdf`
 * - KTA: `KTA_Data_<count>_yyyy-mm-dd.pdf`
 *
 * @param rows - generated rows to export
 * @param cardType - "KTP" or "KTA"
 * @param onProgress - optional callback `(done, total)` for progress UI
 */
export async function exportPdf(
  rows: KTPGeneratedData[] | KTAGeneratedData[],
  cardType: CardType,
  onProgress?: PdfExportProgressCallback,
): Promise<void> {
  if (rows.length === 0) return;

  const pdfBytes =
    cardType === "KTP"
      ? await exportKtpPdf(rows as KTPGeneratedData[], onProgress)
      : await exportKtaPdf(rows as KTAGeneratedData[], onProgress);

  const date = todayString();
  const filename = `${cardType}_Data_${rows.length}_${date}.pdf`;

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
