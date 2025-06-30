import type { KTPGeneratedData } from "@/lib/types/ktp-types";
import type { KTAGeneratedData } from "@/lib/types/kta-types";
import type { CardType } from "@/lib/types";
import { faker } from "@faker-js/faker/locale/id_ID";

export interface CSVImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  total: number;
}

/**
 * Generate a random NIK (16 digits)
 */
function generateRandomNIK(): string {
  return faker.string.numeric(16);
}

/**
 * Parse CSV content and convert to array of objects
 */
function parseCSV(csvContent: string): Record<string, string>[] {
  console.log("🔍 CSV Parser - Raw content length:", csvContent.length);
  console.log("🔍 CSV Parser - First 200 chars:", csvContent.substring(0, 200));

  const lines = csvContent.trim().split("\n");
  console.log("🔍 CSV Parser - Total lines:", lines.length);

  if (lines.length < 2) {
    throw new Error("File CSV harus memiliki minimal header dan 1 baris data");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  console.log("🔍 CSV Parser - Headers:", headers);
  console.log("🔍 CSV Parser - Headers count:", headers.length);

  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    console.log(`🔍 CSV Parser - Processing line ${i}:`, lines[i]);

    // Better CSV parsing with proper quote handling
    const values = parseCSVLine(lines[i]);
    console.log(`🔍 CSV Parser - Parsed values line ${i}:`, values);
    console.log(
      `🔍 CSV Parser - Values count: ${values.length}, Headers count: ${headers.length}`,
    );

    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      console.log(`🔍 CSV Parser - Row ${i} created:`, row);
      data.push(row);
    } else {
      console.warn(
        `⚠️ CSV Parser - Line ${i} skipped: values(${values.length}) != headers(${headers.length})`,
      );
    }
  }

  console.log("🔍 CSV Parser - Final data count:", data.length);
  return data;
}

/**
 * Parse a single CSV line with proper quote handling
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      // End of field
      let cleaned = current.trim();
      // Handle Excel formula format for NIK (="123456")
      if (cleaned.startsWith("=") && cleaned.includes('"')) {
        cleaned = cleaned.replace(/^="?|"?$/g, "");
      }
      values.push(cleaned);
      current = "";
      i++;
      continue;
    } else {
      current += char;
    }
    i++;
  }

  // Add the last field
  let cleaned = current.trim();
  if (cleaned.startsWith("=") && cleaned.includes('"')) {
    cleaned = cleaned.replace(/^="?|"?$/g, "");
  }
  values.push(cleaned);

  return values;
}

/**
 * Validate KTP data from CSV
 */
function validateKTPData(
  row: Record<string, string>,
  index: number,
): {
  isValid: boolean;
  data?: KTPGeneratedData;
  errors: string[];
  warnings: string[];
} {
  console.log(`🔍 KTP Validator - Row ${index + 1}:`, row);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields for KTP
  const requiredFields = [
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

  console.log(
    `🔍 KTP Validator - Checking required fields for row ${index + 1}`,
  );
  for (const field of requiredFields) {
    const value = row[field]?.trim();
    console.log(
      `🔍 KTP Validator - Field '${field}': '${value}' (${value ? "OK" : "EMPTY"})`,
    );
    if (!value) {
      errors.push(`Baris ${index + 1}: Field ${field} tidak boleh kosong`);
    }
  }

  // Check for NIK validation separately
  let nikToUse = row.nik;
  if (row.nik && !/^\d{16}$/.test(row.nik)) {
    nikToUse = generateRandomNIK();
    warnings.push(
      `Baris ${index + 1}: NIK tidak valid (${row.nik}), diganti dengan NIK baru (${nikToUse})`,
    );
  }

  // Validate gender
  if (
    row.gender &&
    !["LAKI-LAKI", "PEREMPUAN", "Laki-laki", "Perempuan"].includes(row.gender)
  ) {
    errors.push(
      `Baris ${index + 1}: Gender harus "LAKI-LAKI" atau "PEREMPUAN"`,
    );
  }

  // Validate blood type (with or without Rhesus factor)
  if (row.bloodType && !/^(A|B|AB|O)[+-]?$/.test(row.bloodType)) {
    errors.push(
      `Baris ${index + 1}: Golongan darah harus A, B, AB, O (dengan atau tanpa rhesus +/-)`,
    );
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Split birthDatePlace into birthPlace and birthDate
  const [birthPlace = "", birthDate = ""] = row.birthDatePlace.split(", ");

  // Split rtRw into rt and rw
  const [rt = "", rw = ""] = row.rtRw.split("/");

  const ktpData: KTPGeneratedData = {
    nik: nikToUse,
    name: row.name,
    birthPlace: birthPlace.trim(),
    birthDate: birthDate.trim(),
    birthDatePlace: row.birthDatePlace,
    gender: row.gender,
    address: row.address,
    rt: rt.trim(),
    rw: rw.trim(),
    rtRw: row.rtRw,
    village: row.village,
    district: row.district,
    city: row.city,
    province: row.province,
    religion: row.religion,
    maritalStatus: row.maritalStatus,
    occupation: row.occupation,
    bloodType: row.bloodType,
    nationality: row.nationality || "WNI",
    validityPeriod: row.validityPeriod || "SEUMUR HIDUP",
  };

  return { isValid: true, data: ktpData, errors: [], warnings };
}

/**
 * Validate KTA data from CSV
 */
function validateKTAData(
  row: Record<string, string>,
  index: number,
): {
  isValid: boolean;
  data?: KTAGeneratedData;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields for KTA
  const requiredFields = [
    "nik",
    "name",
    "birthDatePlace",
    "gender",
    "familyCertificateNumber",
    "headFamilyName",
    "birthCertificateNumber",
    "religion",
    "address",
    "rtRw",
    "village",
    "district",
    "bloodType",
  ];

  for (const field of requiredFields) {
    if (!row[field]?.trim()) {
      errors.push(`Baris ${index + 1}: Field ${field} tidak boleh kosong`);
    }
  }

  // Check for NIK validation separately
  let nikToUse = row.nik;
  if (row.nik && !/^\d{16}$/.test(row.nik)) {
    nikToUse = generateRandomNIK();
    warnings.push(
      `Baris ${index + 1}: NIK tidak valid (${row.nik}), diganti dengan NIK baru (${nikToUse})`,
    );
  }

  // Validate gender
  if (
    row.gender &&
    !["LAKI-LAKI", "PEREMPUAN", "Laki-laki", "Perempuan"].includes(row.gender)
  ) {
    errors.push(
      `Baris ${index + 1}: Gender harus "LAKI-LAKI" atau "PEREMPUAN"`,
    );
  }

  // Validate blood type (with or without Rhesus factor)
  if (row.bloodType && !/^(A|B|AB|O)[+-]?$/.test(row.bloodType)) {
    errors.push(
      `Baris ${index + 1}: Golongan darah harus A, B, AB, O (dengan atau tanpa rhesus +/-)`,
    );
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Split birthDatePlace into birthPlace and birthDate
  const [birthPlace = "", birthDate = ""] = row.birthDatePlace.split(", ");

  // Split rtRw into rt and rw
  const [rt = "", rw = ""] = row.rtRw.split("/");

  const ktaData: KTAGeneratedData = {
    nik: nikToUse,
    name: row.name,
    birthPlace: birthPlace.trim(),
    birthDate: birthDate.trim(),
    birthDatePlace: row.birthDatePlace,
    gender: row.gender,
    familyCertificateNumber: row.familyCertificateNumber,
    headFamilyName: row.headFamilyName,
    birthCertificateNumber: row.birthCertificateNumber,
    religion: row.religion,
    nationality: row.nationality || "WNI",
    address: row.address,
    rt: rt.trim(),
    rw: rw.trim(),
    rtRw: row.rtRw,
    village: row.village,
    district: row.district,
    province: row.province || "",
    city: row.city || "",
    validityPeriod: row.validityPeriod || "SEUMUR HIDUP",
    bloodType: row.bloodType,
  };

  return { isValid: true, data: ktaData, errors: [], warnings };
}

/**
 * Import CSV file and convert to KTP or KTA data
 */
export async function importCSV(
  file: File,
  cardType: CardType,
): Promise<CSVImportResult<KTPGeneratedData | KTAGeneratedData>> {
  console.log("🚀 CSV Import started");
  console.log("📄 File name:", file.name);
  console.log("📦 File size:", file.size, "bytes");
  console.log("🎯 Card type:", cardType);

  try {
    const csvContent = await file.text();
    console.log("📝 CSV Content loaded, length:", csvContent.length);

    const rows = parseCSV(csvContent);
    console.log("📊 Parsed rows count:", rows.length);

    const data: (KTPGeneratedData | KTAGeneratedData)[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`🔄 Processing row ${i + 1}/${rows.length}`);

      if (cardType === "KTP") {
        const validation = validateKTPData(row, i);
        console.log(`🔍 KTP validation result for row ${i + 1}:`, {
          isValid: validation.isValid,
          hasData: !!validation.data,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
        });

        if (validation.isValid && validation.data) {
          data.push(validation.data);
          console.log(`✅ Row ${i + 1} added to data`);
        } else {
          errors.push(...validation.errors);
          console.log(`❌ Row ${i + 1} failed validation:`, validation.errors);
        }

        // Always collect warnings
        warnings.push(...validation.warnings);
      } else {
        const validation = validateKTAData(row, i);
        console.log(`🔍 KTA validation result for row ${i + 1}:`, {
          isValid: validation.isValid,
          hasData: !!validation.data,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
        });

        if (validation.isValid && validation.data) {
          data.push(validation.data);
          console.log(`✅ Row ${i + 1} added to data`);
        } else {
          errors.push(...validation.errors);
          console.log(`❌ Row ${i + 1} failed validation:`, validation.errors);
        }

        // Always collect warnings
        warnings.push(...validation.warnings);
      }
    }

    console.log("🏁 Import completed");
    console.log("📈 Final statistics:");
    console.log("  - Total rows processed:", rows.length);
    console.log("  - Valid data count:", data.length);
    console.log("  - Total errors:", errors.length);
    console.log("  - Errors:", errors);
    console.log("  - Total warnings:", warnings.length);
    console.log("  - Warnings:", warnings);

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
      total: rows.length,
    };
  } catch (error) {
    console.error("💥 CSV Import failed with error:", error);
    return {
      success: false,
      data: [],
      errors: [
        error instanceof Error ? error.message : "Error parsing CSV file",
      ],
      warnings: [],
      total: 0,
    };
  }
}

/**
 * Generate CSV template for KTP
 */
export function generateKTPTemplate(): string {
  const headers = [
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
    "nationality",
    "validityPeriod",
  ];

  const sampleData = [
    `="3201234567890123"`,
    "AHMAD WIJAYA",
    "JAKARTA, 15-05-1990",
    "LAKI-LAKI",
    "JL. SUDIRMAN NO. 123",
    "001/002",
    "KEBAYORAN BARU",
    "KEBAYORAN BARU",
    "JAKARTA SELATAN",
    "DKI JAKARTA",
    "ISLAM",
    "BELUM KAWIN",
    "KARYAWAN SWASTA",
    "A+",
    "WNI",
    "SEUMUR HIDUP",
  ];

  return (
    headers.join(",") +
    "\n" +
    sampleData
      .map(
        (cell, index) => (index === 0 ? cell : `"${cell}"`), // NIK already has ="..." format, wrap others in quotes
      )
      .join(",")
  );
}

/**
 * Generate CSV template for KTA
 */
export function generateKTATemplate(): string {
  const headers = [
    "nik",
    "name",
    "birthDatePlace",
    "gender",
    "familyCertificateNumber",
    "headFamilyName",
    "birthCertificateNumber",
    "religion",
    "nationality",
    "address",
    "rtRw",
    "village",
    "district",
    "province",
    "city",
    "validityPeriod",
    "bloodType",
  ];

  const sampleData = [
    `="3201234567890124"`,
    "SITI NURHALIZA",
    "BANDUNG, 20-08-2010",
    "PEREMPUAN",
    `="3201012345678901"`,
    "AHMAD WIJAYA",
    "3201-LT-20082010-0001",
    "ISLAM",
    "WNI",
    "JL. ASIA AFRIKA NO. 456",
    "003/004",
    "BRAGA",
    "SUMUR BANDUNG",
    "JAWA BARAT",
    "BANDUNG",
    "SEUMUR HIDUP",
    "B-",
  ];

  return (
    headers.join(",") +
    "\n" +
    sampleData
      .map(
        (cell, index) => (index === 0 || index === 4 ? cell : `"${cell}"`), // NIK and familyCertificateNumber have ="..." format
      )
      .join(",")
  );
}

/**
 * Download template file
 */
export function downloadTemplate(cardType: CardType): void {
  const template =
    cardType === "KTP" ? generateKTPTemplate() : generateKTATemplate();
  const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `template-${cardType.toLowerCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
