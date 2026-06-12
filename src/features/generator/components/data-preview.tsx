"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  SparklesIcon,
  TablePropertiesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { exportCsv } from "~/features/generator/components/csv-export";
import { exportPdf } from "~/features/generator/components/pdf-export";
import { CsvUpload } from "~/features/generator/components/csv-upload";
import type {
  CardType,
  GeneratedRow,
  KTAGeneratedData,
  KTPGeneratedData,
} from "~/features/generator/domain/types";
import type { CsvUploadResult } from "./csv-upload";

// ---------------------------------------------------------------------------
// Column definitions per card type
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: string;
  label: string;
}

const KTP_COLUMNS: ColumnDef[] = [
  { key: "nik", label: "NIK" },
  { key: "name", label: "Nama" },
  { key: "birthDatePlace", label: "Tgl/Tempat Lahir" },
  { key: "gender", label: "Gender" },
  { key: "address", label: "Alamat" },
  { key: "rtRw", label: "RT/RW" },
  { key: "village", label: "Kelurahan" },
  { key: "district", label: "Kecamatan" },
  { key: "city", label: "Kota" },
  { key: "province", label: "Provinsi" },
  { key: "religion", label: "Agama" },
  { key: "maritalStatus", label: "Status" },
  { key: "occupation", label: "Pekerjaan" },
  { key: "bloodType", label: "Goldar" },
];

const KTA_COLUMNS: ColumnDef[] = [
  { key: "nik", label: "NIK" },
  { key: "name", label: "Nama" },
  { key: "birthDatePlace", label: "Tgl/Tempat Lahir" },
  { key: "gender", label: "Gender" },
  { key: "familyCertificateNumber", label: "No. KK" },
  { key: "headFamilyName", label: "Kepala Keluarga" },
  { key: "birthCertificateNumber", label: "No. Akta" },
  { key: "religion", label: "Agama" },
  { key: "nationality", label: "Kewarganegaraan" },
  { key: "address", label: "Alamat" },
  { key: "rtRw", label: "RT/RW" },
  { key: "village", label: "Kelurahan" },
  { key: "district", label: "Kecamatan" },
  { key: "city", label: "Kota" },
  { key: "province", label: "Provinsi" },
  { key: "validityPeriod", label: "Berlaku Hingga" },
  { key: "bloodType", label: "Goldar" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DataPreviewProps {
  cardType: CardType;
  rows: GeneratedRow[];
  onClear: () => void;
  onImport: (result: CsvUploadResult) => void;
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-xs font-semibold uppercase">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

function usePagination(totalRows: number) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setPage(1);
  }, [totalRows]);

  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalRows);

  return {
    page: clampedPage,
    totalPages,
    start,
    end,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}

// ---------------------------------------------------------------------------
// PDF export state
// ---------------------------------------------------------------------------

interface PdfProgress {
  done: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DataPreview({ cardType, rows, onClear, onImport }: DataPreviewProps) {
  const columns = cardType === "KTP" ? KTP_COLUMNS : KTA_COLUMNS;
  const pag = usePagination(rows.length);
  const visibleRows = rows.slice(pag.start, pag.end);

  const [pdfProgress, setPdfProgress] = React.useState<PdfProgress | null>(null);

  // Summary stats
  const maleCount = rows.filter((r) => r.gender === "LAKI-LAKI").length;
  const femaleCount = rows.filter((r) => r.gender === "PEREMPUAN").length;
  const provinceCount = new Set(rows.map((r) => r.province)).size;

  const hasData = rows.length > 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleCsvExport() {
    if (!hasData) return;
    try {
      exportCsv(
        rows as KTPGeneratedData[] | KTAGeneratedData[],
        cardType,
      );
      toast.success(`CSV ${cardType} berhasil diunduh.`);
    } catch {
      toast.error("Gagal mengunduh CSV.");
    }
  }

  async function handlePdfExport() {
    if (!hasData || pdfProgress) return;
    try {
      setPdfProgress({ done: 0, total: rows.length });
      await exportPdf(
        rows as KTPGeneratedData[] | KTAGeneratedData[],
        cardType,
        (done, total) => setPdfProgress({ done, total }),
      );
      toast.success(`PDF ${cardType} berhasil diunduh.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor PDF.");
    } finally {
      setPdfProgress(null);
    }
  }

  function handleClear() {
    if (!hasData) {
      onClear();
      return;
    }
    // Confirm before clearing
    if (window.confirm(`Hapus ${rows.length} data ${cardType}? Tindakan ini tidak dapat dibatalkan.`)) {
      onClear();
    }
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (!hasData) {
    const emptyMessage =
      cardType === "KTP"
        ? "Belum ada data KTP. Hasilkan data atau impor template CSV."
        : "Belum ada data KTA. Hasilkan data atau impor template CSV.";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Pratinjau Data {cardType}</CardTitle>
          <CardDescription>{emptyMessage}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Metrics — all zero */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label="Total Data" value={0} icon={<TablePropertiesIcon className="size-4" />} />
            <Metric label="Laki-laki" value={0} icon={<SparklesIcon className="size-4" />} />
            <Metric label="Perempuan" value={0} icon={<SparklesIcon className="size-4" />} />
            <Metric label="Provinsi" value={0} icon={<TablePropertiesIcon className="size-4" />} />
          </div>

          <div
            className="flex min-h-48 flex-col items-center justify-center gap-4 border border-dashed border-border p-6 text-center"
            aria-label={`Area pratinjau kosong ${cardType}`}
          >
            <UploadIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="max-w-xs text-sm text-muted-foreground">{emptyMessage}</p>
            <CsvUpload cardType={cardType} onImport={onImport} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Generated state
  // -------------------------------------------------------------------------

  const pdfPercent = pdfProgress
    ? Math.round((pdfProgress.done / pdfProgress.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Pratinjau Data {cardType}</CardTitle>
            <CardDescription
              aria-live="polite"
              aria-atomic="true"
            >
              {rows.length.toLocaleString("id-ID")} data berhasil dibuat.
            </CardDescription>
          </div>

          {/* Export / Clear actions */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Aksi ekspor">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCsvExport}
              disabled={!hasData}
              aria-label="Ekspor CSV"
            >
              <FileSpreadsheetIcon data-icon="inline-start" />
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void handlePdfExport()}
              disabled={!hasData || Boolean(pdfProgress)}
              aria-label="Ekspor PDF"
              aria-busy={Boolean(pdfProgress)}
            >
              <FileTextIcon data-icon="inline-start" />
              PDF
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              aria-label="Hapus data"
            >
              <Trash2Icon data-icon="inline-start" />
              Hapus
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* PDF progress bar */}
        {pdfProgress && (
          <div aria-live="polite" aria-label="PDF export progress">
            <p className="mb-1 text-xs text-muted-foreground">
              Mengekspor PDF… {pdfProgress.done}/{pdfProgress.total}
            </p>
            <Progress value={pdfPercent} className="h-1.5" />
          </div>
        )}

        {/* Summary metrics */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="Total Data" value={rows.length} icon={<TablePropertiesIcon className="size-4" />} />
          <Metric label="Laki-laki" value={maleCount} icon={<SparklesIcon className="size-4" />} />
          <Metric label="Perempuan" value={femaleCount} icon={<SparklesIcon className="size-4" />} />
          <Metric label="Provinsi" value={provinceCount} icon={<TablePropertiesIcon className="size-4" />} />
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto rounded-none border border-border"
          role="region"
          aria-label={`Tabel data ${cardType}`}
          tabIndex={0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, idx) => {
                const absoluteIdx = pag.start + idx;
                return (
                  <TableRow key={`${row.nik}-${absoluteIdx}`}>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {absoluteIdx + 1}
                    </TableCell>
                    {columns.map((col) => {
                      const value = (row as unknown as Record<string, unknown>)[col.key];
                      const cellValue = value !== undefined && value !== null ? String(value) : "";
                      if (col.key === "gender") {
                        return (
                          <TableCell key={col.key} className="whitespace-nowrap">
                            <Badge variant="secondary">{cellValue}</Badge>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={col.key} className="whitespace-nowrap text-sm">
                          {cellValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination + range text + CSV import */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            Menampilkan {pag.start + 1}–{pag.end} dari {rows.length.toLocaleString("id-ID")}
          </p>

          <nav aria-label="Navigasi halaman data" className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={pag.prev}
              disabled={!pag.hasPrev}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-[5rem] text-center text-xs text-muted-foreground">
              {pag.page} / {pag.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={pag.next}
              disabled={!pag.hasNext}
              aria-label="Halaman berikutnya"
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        </div>

        {/* CSV import in generated state */}
        <div className="border-t border-border pt-4">
          <CsvUpload
            cardType={cardType}
            onImport={onImport}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
