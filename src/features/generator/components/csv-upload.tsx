"use client";

import * as React from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { parseCsvRows } from "~/features/generator/domain/csv";
import { downloadTemplate } from "~/features/generator/components/csv-export";
import type { CardType, GeneratedRow, KTAGeneratedData, KTPGeneratedData } from "~/features/generator/domain/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CsvUploadResult {
  rows: GeneratedRow[];
  errorCount: number;
  warningCount: number;
}

interface CsvUploadProps {
  cardType: CardType;
  onImport: (result: CsvUploadResult) => void;
  /** Optional additional class names for the container. */
  className?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; rowCount: number; errorCount: number; warningCount: number }
  | { status: "error"; errors: string[]; total: number }
  | { status: "warn"; rowCount: number; warnings: string[]; total: number };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CsvUpload({ cardType, onImport, className }: CsvUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: "idle" });

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleTemplateDownload() {
    downloadTemplate(cardType);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so the same file can be re-selected
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadState({
        status: "error",
        errors: [`File "${file.name}" is not a CSV file. Please select a .csv file.`],
        total: 1,
      });
      return;
    }

    setUploadState({ status: "parsing" });

    try {
      const text = await file.text();
      const result = parseCsvRows(text, cardType);
      const { rows, errors, warnings } = result;

      if (errors.length > 0) {
        const messages = errors.slice(0, 5).map(
          (e) => `Row ${e.row}: [${e.field}] ${e.message}`,
        );
        setUploadState({
          status: "error",
          errors: messages,
          total: errors.length,
        });
        return;
      }

      if (warnings.length > 0) {
        const messages = warnings.slice(0, 5).map(
          (w) => `Row ${w.row}: [${w.field}] ${w.message}`,
        );
        setUploadState({
          status: "warn",
          rowCount: rows.length,
          warnings: messages,
          total: warnings.length,
        });
      } else {
        setUploadState({
          status: "success",
          rowCount: rows.length,
          errorCount: 0,
          warningCount: 0,
        });
      }

      onImport({
        rows: rows as KTPGeneratedData[] | KTAGeneratedData[],
        errorCount: errors.length,
        warningCount: warnings.length,
      });
    } catch (err) {
      setUploadState({
        status: "error",
        errors: [err instanceof Error ? err.message : "Unknown error while reading file."],
        total: 1,
      });
    }
  }

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        aria-label={`Upload ${cardType} CSV file`}
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploadState.status === "parsing"}
          onClick={handleUploadClick}
        >
          {uploadState.status === "parsing" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <UploadIcon data-icon="inline-start" />
          )}
          {uploadState.status === "parsing" ? "Memproses..." : "Impor CSV"}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleTemplateDownload}>
          <DownloadIcon data-icon="inline-start" />
          Unduh Template
        </Button>
      </div>

      {/* Status feedback */}
      {uploadState.status === "success" && (
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {uploadState.rowCount} data berhasil diimpor.
        </p>
      )}

      {uploadState.status === "warn" && (
        <Alert variant="default" className="mt-3">
          <AlertTitle className="text-sm">
            {uploadState.rowCount} data diimpor dengan {uploadState.total} peringatan
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1 text-xs" aria-live="polite">
              {uploadState.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
              {uploadState.total > 5 && (
                <li>…dan {uploadState.total - 5} peringatan lainnya.</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {uploadState.status === "error" && (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle className="text-sm">Gagal mengimpor CSV</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1 text-xs" aria-live="assertive">
              {uploadState.errors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
              {uploadState.total > 5 && (
                <li>…dan {uploadState.total - 5} kesalahan lainnya.</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Format tanggal: DD-MM-YYYY. NIK disimpan sebagai teks agar aman di Excel.
      </p>
    </div>
  );
}
