import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { DEFAULT_KTP_POSITION_CONFIG } from "@/lib/constant/ktp-position-constant";
import type {
  KTPGeneratedData,
  KTPPositionConfig,
} from "@/lib/types/ktp-types";

// Use the EXACT same template dimensions as preview for pixel-perfect accuracy
const TEMPLATE_WIDTH = 650;
const TEMPLATE_HEIGHT = 410;

// Manual Y-axis adjustment for fine-tuning PDF text position
// Positive value = move text DOWN, Negative value = move text UP
// Adjust this value to match preview positioning perfectly
const MANUAL_Y_OFFSET = -15; // Start with 0, then adjust as needed (e.g. +5, -3, etc.)

/**
 * Convert hex color to RGB
 * @param hex - The hex color string
 * @returns The RGB color object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Download PDF
 * @param pdfBytes - The PDF bytes
 * @param filename - The filename
 */
export async function downloadPDF(
  pdfBytes: Uint8Array,
  filename: string,
): Promise<void> {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export KTP to PDF
 * @param data - The KTP data
 * @param positionConfig - The position configuration
 * @param onProgress - The progress callback
 */
export async function exportKTPToPDF(
  data: KTPGeneratedData[],
  positionConfig: KTPPositionConfig = DEFAULT_KTP_POSITION_CONFIG,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  try {
    // Load background image
    const backgroundResponse = await fetch("/KTP Template.png");
    if (!backgroundResponse) {
      throw new Error("Failed to load background image");
    }
    const backroundBytes = await backgroundResponse.arrayBuffer();

    // Create final PDF document
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );

    // Embed background image
    const backgroundImage = await pdfDoc.embedPng(backroundBytes);

    for (let i = 0; i < data.length; i++) {
      const ktp = data[i];

      // Report progress
      if (onProgress) {
        onProgress(i + 1, data.length);
      }

      // Create new page with EXACT template dimensions
      const page = pdfDoc.addPage([TEMPLATE_WIDTH, TEMPLATE_HEIGHT]);

      // Draw background image at exact size
      page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: TEMPLATE_WIDTH,
        height: TEMPLATE_HEIGHT,
      });

      // Add text overlays based on configuration
      await addKTPTextOverlay(
        page,
        ktp,
        positionConfig,
        helveticaFont,
        helveticaBoldFont,
      );

      // Small delay to prevent browser freeze
      if (i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Save and download
    const pdfBytes = await pdfDoc.save();
    downloadPDF(
      pdfBytes,
      `KTP_Data_${data.length}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  } catch (error) {
    console.error("Error exporting KTP to PDF:", error);
    throw error;
  }
}

/**
 * Add KTP text overlay
 * @param page - The page
 * @param ktp - The KTP data
 * @param config - The position configuration
 * @param normalFont - The normal font
 * @param boldFont - The bold font
 */
async function addKTPTextOverlay(
  page: PDFPage,
  ktp: KTPGeneratedData,
  config: KTPPositionConfig,
  normalFont: PDFFont,
  boldFont: PDFFont,
): Promise<void> {
  // Helper function to get field value (same as preview)
  const getFieldValue = (fieldName: keyof KTPPositionConfig): string => {
    switch (fieldName) {
      case "province":
        return `PROVINSI ${ktp.province}`;
      case "city":
        return ktp.city;
      case "nik":
        return ktp.nik;
      case "name":
        return ktp.name;
      case "birthDatePlace":
        return ktp.birthDatePlace;
      case "gender":
        return ktp.gender;
      case "address":
        return ktp.address;
      case "rtRw":
        return ktp.rtRw;
      case "village":
        return ktp.village;
      case "district":
        return ktp.district;
      case "religion":
        return ktp.religion;
      case "maritalStatus":
        return ktp.maritalStatus;
      case "occupation":
        return ktp.occupation;
      case "bloodType":
        return ktp.bloodType;
      case "nationality":
        return "WNI";
      case "validUntil":
        return "Seumur Hidup";
      default:
        return "";
    }
  };

  // Helper function to get CSS transform equivalent for PDF
  const getTransformForAlignment = (
    align: "left" | "center" | "right",
    textWidth: number,
  ): number => {
    switch (align) {
      case "center":
        return -textWidth / 2; // translateX(-50%)
      case "right":
        return -textWidth; // translateX(-100%)
      default:
        return 0; // translateX(0)
    }
  };

  // More accurate text width calculation using pdf-lib's measurement
  const getTextWidth = (
    text: string,
    font: PDFFont,
    fontSize: number,
  ): number => {
    return font.widthOfTextAtSize(text, fontSize);
  };

  // Draw each field exactly as preview
  Object.entries(config).forEach(([fieldName, fieldConfig]) => {
    if (!fieldConfig.enabled) return;

    const field = fieldName as keyof KTPPositionConfig;
    const value = getFieldValue(field);
    const font =
      fieldConfig.style.fontWeight === "bold" ? boldFont : normalFont;

    // Convert percentage to pixels (EXACT same as preview)
    const x = (fieldConfig.position.x / 100) * TEMPLATE_WIDTH;
    const y = (fieldConfig.position.y / 100) * TEMPLATE_HEIGHT;

    // Get accurate text width
    const textWidth = getTextWidth(value, font, fieldConfig.style.fontSize);

    // Apply alignment transform (same as CSS)
    const alignmentOffset = getTransformForAlignment(
      fieldConfig.position.align,
      textWidth,
    );

    // Convert to PDF coordinate system with manual Y adjustment
    const pdfX = x + alignmentOffset;
    // CSS: top edge at Y position from top
    // PDF: Y from bottom + manual offset for fine-tuning
    const pdfY = TEMPLATE_HEIGHT - y + MANUAL_Y_OFFSET;

    // Parse color
    const color = hexToRgb(fieldConfig.style.color);

    // Enhanced debug log for calibration
    if (
      field === "nik" ||
      field === "name" ||
      field === "province" ||
      field === "city"
    ) {
      console.log(`Field ${field}:`, {
        value,
        cssPercent: { x: fieldConfig.position.x, y: fieldConfig.position.y },
        cssPixels: { x, y },
        pdfCoord: { x: pdfX, y: pdfY },
        fontSize: fieldConfig.style.fontSize,
        manualYOffset: MANUAL_Y_OFFSET,
        alignment: fieldConfig.position.align,
      });
    }

    page.drawText(value, {
      x: pdfX,
      y: pdfY,
      size: fieldConfig.style.fontSize,
      font: font,
      color: rgb(color.r, color.g, color.b),
    });
  });
}

/**
 * Generate KTP preview PDF
 * @param sampleKtp - The sample KTP data
 * @param positionConfig - The position configuration
 */
export async function generateKTPPreviewPDF(
  sampleKtp: KTPGeneratedData,
  positionConfig: KTPPositionConfig,
): Promise<void> {
  await exportKTPToPDF([sampleKtp], positionConfig);
}
