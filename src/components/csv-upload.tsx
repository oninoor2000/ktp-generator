import { useCallback, useRef, useState } from "react";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { CardType } from "@/lib/types";
import type { KTPGeneratedData } from "@/lib/types/ktp-types";
import type { KTAGeneratedData } from "@/lib/types/kta-types";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  importCSV,
  downloadTemplate,
  type CSVImportResult,
} from "@/service/csv-importer";

interface Props {
  cardType: CardType;
  onDataImported: (data: KTPGeneratedData[] | KTAGeneratedData[]) => void;
}

export function CSVUpload({ cardType, onDataImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVImportResult<
    KTPGeneratedData | KTAGeneratedData
  > | null>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".csv")) {
        toast.error("Silakan pilih file CSV yang valid");
        return;
      }

      setIsUploading(true);
      setUploadResult(null);

      try {
        const result = await importCSV(file, cardType);
        setUploadResult(result);

        if (result.success && result.data.length > 0) {
          onDataImported(
            result.data as KTPGeneratedData[] | KTAGeneratedData[],
          );
          if (result.warnings.length > 0) {
            toast.success(
              `${result.data.length} data ${cardType} berhasil diimport dengan ${result.warnings.length} peringatan`,
            );
          } else {
            toast.success(
              `${result.data.length} data ${cardType} berhasil diimport`,
            );
          }
        } else if (result.errors.length > 0) {
          toast.error(`Import gagal: ${result.errors.length} error ditemukan`);
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat memproses file CSV");
        console.error("CSV import error:", error);
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [cardType, onDataImported],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadTemplate(cardType);
      toast.success(`Template ${cardType} berhasil didownload`);
    } catch (error) {
      toast.error("Gagal mendownload template");
      console.error("Template download error:", error);
    }
  }, [cardType]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-xl bg-gradient-to-r p-3",
              cardType === "KTP" && "from-cyan-500 to-blue-600",
              cardType === "KTA" && "from-pink-500 to-red-500",
            )}
          >
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Upload Data {cardType} dari CSV
            </h3>
            <p className="text-muted-foreground text-sm">
              Import data {cardType} dari file CSV atau download template untuk
              diisi
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className={cn(
              "flex flex-1 items-center gap-2 transition-all duration-200",
              cardType === "KTP"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600",
            )}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Memproses..." : `Upload CSV ${cardType}`}
          </Button>

          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Result */}
        {uploadResult && (
          <div className="space-y-3">
            {uploadResult.success ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Import Berhasil
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {uploadResult.data.length} dari {uploadResult.total} data
                      berhasil diimport
                      {uploadResult.warnings.length > 0 &&
                        ` dengan ${uploadResult.warnings.length} peringatan`}
                    </p>
                  </div>
                </div>

                {/* Warnings List */}
                {uploadResult.warnings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Peringatan
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {uploadResult.warnings.length} data telah diperbaiki
                          secara otomatis:
                        </p>
                      </div>
                    </div>

                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {uploadResult.warnings
                        .slice(0, 5)
                        .map((warning, index) => (
                          <div
                            key={index}
                            className="rounded bg-yellow-50 p-2 text-sm text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
                          >
                            {warning}
                          </div>
                        ))}
                      {uploadResult.warnings.length > 5 && (
                        <div className="text-sm text-yellow-600 italic dark:text-yellow-400">
                          ... dan {uploadResult.warnings.length - 5} peringatan
                          lainnya
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Import Gagal
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {uploadResult.errors.length} error ditemukan:
                    </p>
                  </div>
                </div>

                {/* Error List */}
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {uploadResult.errors.slice(0, 5).map((error, index) => (
                    <div
                      key={index}
                      className="rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
                    >
                      {error}
                    </div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <div className="text-sm text-red-600 italic dark:text-red-400">
                      ... dan {uploadResult.errors.length - 5} error lainnya
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <FileText className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="text-muted-foreground text-sm">
              <p className="mb-2 font-medium">Petunjuk Upload CSV:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Download template CSV terlebih dahulu</li>
                <li>Isi data sesuai format yang tersedia</li>
                <li>Pastikan format tanggal lahir: "Tempat, dd-mm-yyyy"</li>
                <li>Pastikan format RT/RW: "001/002"</li>
                <li>
                  NIK yang tidak valid (bukan 16 digit) akan diganti otomatis
                </li>
                <li>Upload file CSV yang sudah diisi</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
