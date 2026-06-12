/**
 * Browser-only CSV export helper.
 *
 * Serializes generated rows to CSV and triggers a download.
 * Must not be imported server-side (uses `document`/`URL`).
 */

import {
  serializeKtpRows,
  serializeKtaRows,
} from "~/features/generator/domain/csv";
import type {
  CardType,
  KTAGeneratedData,
  KTPGeneratedData,
} from "~/features/generator/domain/types";

function todayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
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

/**
 * Export generated KTP or KTA rows as a UTF-8 CSV file.
 *
 * File naming:
 * - KTP: `Data_KTP_yyyy-mm-dd.csv`
 * - KTA: `Data_KTA_yyyy-mm-dd.csv`
 */
export function exportCsv(
  rows: KTPGeneratedData[] | KTAGeneratedData[],
  cardType: CardType,
): void {
  const date = todayString();
  const filename = `Data_${cardType}_${date}.csv`;
  const csvText =
    cardType === "KTP"
      ? serializeKtpRows(rows as KTPGeneratedData[])
      : serializeKtaRows(rows as KTAGeneratedData[]);

  triggerDownload(csvText, filename, "text/csv;charset=utf-8;");
}

/**
 * Download a blank CSV template for the given card type.
 * Uses the static template files already in `/public`.
 */
export function downloadTemplate(cardType: CardType): void {
  const filename =
    cardType === "KTP" ? "template-ktp-example.csv" : "template-kta-example.csv";
  const anchor = document.createElement("a");
  anchor.href = `/${filename}`;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
