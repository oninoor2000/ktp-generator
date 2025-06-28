import { useCallback, useState } from "react";

import type {
  KTPGeneratedData,
  KTPPositionConfig,
} from "@/lib/types/ktp-types";
import type { CardType } from "@/lib/types";
import type { KTAGeneratedData } from "@/lib/types/kta-types";

import {
  Baby,
  FileText,
  CreditCard,
  FileUserIcon,
  FileSpreadsheet,
} from "lucide-react";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "./ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { exportToExcel } from "@/service/excel-exporter";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { exportKTPToPDF } from "@/service/pdf-exporter";
import { DEFAULT_KTP_POSITION_CONFIG } from "@/lib/constant/ktp-position-constant";

interface Props {
  data: KTPGeneratedData[] | KTAGeneratedData[];
  cardType: CardType;
  positionConfig?: KTPPositionConfig;
}

function DataPreview({ data, cardType, positionConfig }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const [isExporting, setIsExporting] = useState(false);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const formatLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      nik: "NIK",
      name: "Nama Lengkap",
      birthDatePlace: "Tempat/Tgl. Lahir",
      gender: "Jenis Kelamin",
      address: "Alamat",
      rtRw: "RT/RW",
      village: "Kel/Desa",
      district: "Kecamatan",
      province: "Provinsi",
      city: "Kota",
      religion: "Agama",
      maritalStatus: "Status Perkawinan",
      occupation: "Pekerjaan",
      bloodType: "Golongan Darah",
    };
    return labelMap[key] || key;
  };

  // Display specific fields for KTP preview
  const previewFields = [
    "nik",
    "name",
    "birthDatePlace",
    "gender",
    "address",
    "rtRw",
    "village",
    "district",
    "city",
    "province",
    "religion",
    "maritalStatus",
    "occupation",
    "bloodType",
  ];

  const handleExcelExport = useCallback(async () => {
    setIsExporting(true);

    // Try awaiting the export and show await state with toast
    try {
      toast.promise(exportToExcel(data), {
        loading: "Mengekspor data...",
        success: "Data berhasil diekspor",
        error: "Gagal mengekspor data",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
    setIsExporting(false);
  }, [data]);

  const handlePDFExport = useCallback(async () => {
    if (cardType === "KTP") {
      if (data.length === 0) return;
      setIsExporting(true);

      try {
        toast.promise(
          exportKTPToPDF(
            data as KTPGeneratedData[],
            positionConfig ?? DEFAULT_KTP_POSITION_CONFIG,
          ),
          {
            loading: "Mengekspor data...",
            success: "Data berhasil diekspor",
            error: "Gagal mengekspor data",
          },
        );
      } catch (error) {
        console.error("Error exporting template PDF:", error);
        toast.error(
          "Terjadi kesalahan saat export PDF. Pastikan template tersedia dan coba lagi.",
        );
      } finally {
        setIsExporting(false);
      }
    } else {
      // TODO: Implement KTA PDF export
    }
  }, [data, cardType, positionConfig]);

  if (data.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent>
          <div className="text-center">
            <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-4">
              {cardType === "KTP" ? (
                <CreditCard className="h-12 w-12 text-cyan-500" />
              ) : (
                <Baby className="h-12 w-12 text-pink-500" />
              )}
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Belum Ada Data {cardType === "KTP" ? "KTP" : "KTA"}
            </h3>
            <p className="text-muted-foreground">
              Klik tombol "Generate Data" untuk membuat data dummy{" "}
              {cardType === "KTP" ? "KTP" : "KTA"} Indonesia
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="mb-6 flex flex-col items-center justify-between gap-4 lg:flex-row">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-xl bg-gradient-to-r p-3",
              cardType === "KTP" && "from-cyan-500 to-blue-600",
              cardType === "KTA" && "from-pink-500 to-red-500",
            )}
          >
            <FileUserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Preview Data {cardType === "KTP" ? "KTP" : "KTA"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {data.length} data {cardType === "KTP" ? "KTP" : "KTA"} berhasil
              dibuat
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExcelExport}
            disabled={isExporting}
            className="flex transform cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-emerald-600 disabled:scale-100 disabled:from-gray-400 disabled:to-gray-500"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>

          <Button
            onClick={handlePDFExport}
            disabled={isExporting}
            className="flex transform cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-indigo-600 disabled:scale-100 disabled:from-gray-400 disabled:to-gray-500"
          >
            <FileText className="h-4 w-4" />
            PDF Template
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Data Table */}
        <ScrollArea className="w-full rounded-md border whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                {previewFields.map((field) => (
                  <TableHead key={field}>{formatLabel(field)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow key={startIndex + index}>
                  <TableCell className="px-4 py-3 text-sm">
                    {startIndex + index + 1}
                  </TableCell>
                  {previewFields.map((field) => (
                    <TableCell key={field} className="px-4 py-3 text-sm">
                      {cardType === "KTP"
                        ? (item as KTPGeneratedData)[
                            field as keyof KTPGeneratedData
                          ] || "-"
                        : (item as KTAGeneratedData)[
                            field as keyof KTAGeneratedData
                          ] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-accent mt-6 flex flex-col items-center justify-between gap-4 border-t pt-4 lg:flex-row">
            <div className="text-muted-foreground text-sm">
              Menampilkan {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, data.length)} dari{" "}
              {data.length} data
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer rounded border disabled:cursor-not-allowed disabled:opacity-50"
                variant="outline"
              >
                Prev
              </Button>
              <span className="rounded bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-white">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded border disabled:cursor-not-allowed disabled:opacity-50"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Summary Statistics */}
      <CardFooter className="mt-6">
        <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-center dark:from-blue-950 dark:to-indigo-950">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.length}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-400">
              Total Data
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-center dark:from-blue-950 dark:to-indigo-950">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.filter((item) => item.gender === "Laki-laki").length}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-400">
              Laki-laki
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-center dark:from-blue-950 dark:to-indigo-950">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.filter((item) => item.gender === "Perempuan").length}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-400">
              Perempuan
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-center dark:from-blue-950 dark:to-indigo-950">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {[...new Set(data.map((item) => item.province))].length}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-400">
              Provinsi
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default DataPreview;
