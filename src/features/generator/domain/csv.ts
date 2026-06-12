/**
 * CSV domain layer for KTP/KTA import/export.
 *
 * - Template generation (download headers + example row)
 * - Row serialization (generated data → CSV text)
 * - Row parsing/validation (uploaded CSV → domain rows)
 */

import Papa from "papaparse";

import { BLOOD_TYPE, MARITAL_STATUS, RELIGION } from "./constants";
import type {
  CardType,
  KTAGeneratedData,
  KTPGeneratedData,
} from "./types";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

/** Ordered KTP CSV columns as they appear in the template. */
export const KTP_CSV_COLUMNS = [
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
] as const satisfies ReadonlyArray<keyof KTPGeneratedData>;

/** Ordered KTA CSV columns as they appear in the template. */
export const KTA_CSV_COLUMNS = [
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
] as const satisfies ReadonlyArray<keyof KTAGeneratedData>;

// ---------------------------------------------------------------------------
// Excel-safe NIK helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a 16-digit NIK in an Excel formula so spreadsheets treat it as text.
 * `="3201234567890123"`
 */
export function toExcelNik(nik: string): string {
  return `="${nik}"`;
}

/**
 * Parse a NIK value that may come from:
 * - plain `3201234567890123`
 * - Excel-formula `="3201234567890123"`
 * - Quoted formula `"=""3201234567890123"""`
 */
export function parseExcelNik(raw: string): string {
  // Strip outer surrounding quotes that Papa may leave
  let value = raw.trim();
  // Pattern: ="<digits>" with optional extra quotes
  const match = /^=?"?(\d{16})"?$/.exec(value);
  if (match) return match[1]!;
  // Also accept plain 16-digit string
  if (/^\d{16}$/.test(value)) return value;
  return value; // Return raw for downstream validation to report error
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const NIK_RE = /^\d{16}$/;
const DATE_PLACE_RE = /^.+,\s*\d{2}-\d{2}-\d{4}$/;
const RTRTW_RE = /^\d{1,3}\/\d{1,3}$/;

const VALID_GENDERS = new Set(["LAKI-LAKI", "PEREMPUAN"]);
const VALID_RELIGIONS = new Set(RELIGION as ReadonlyArray<string>);
const VALID_BLOOD_TYPES = new Set(BLOOD_TYPE as ReadonlyArray<string>);
const VALID_MARITAL_STATUSES = new Set(MARITAL_STATUS as ReadonlyArray<string>);

export interface CsvParseError {
  row: number;
  field: string;
  message: string;
}

export interface CsvParseWarning {
  row: number;
  field: string;
  message: string;
}

export interface CsvParseResult<T> {
  rows: T[];
  errors: CsvParseError[];
  warnings: CsvParseWarning[];
}

// Intermediate mutable accumulator — looser than the final typed output.
type ParseAccumulator = Partial<Omit<KTPGeneratedData & KTAGeneratedData, "validityPeriod">> & {
  validityPeriod?: string;
};

function validateCommon(
  raw: Record<string, string>,
  rowIndex: number,
  strict: boolean,
): { valid: ParseAccumulator; errors: CsvParseError[]; warnings: CsvParseWarning[] } {
  const errors: CsvParseError[] = [];
  const warnings: CsvParseWarning[] = [];
  const valid: ParseAccumulator = {};

  // NIK
  const nikRaw = String(raw.nik ?? "");
  const nik = parseExcelNik(nikRaw);
  if (!NIK_RE.test(nik)) {
    if (strict) {
      errors.push({ row: rowIndex, field: "nik", message: `Invalid NIK "${nikRaw}" — must be 16 digits` });
    } else {
      warnings.push({ row: rowIndex, field: "nik", message: `NIK "${nikRaw}" is not 16 digits, skipping row` });
    }
  } else {
    valid.nik = nik;
  }

  // name
  const name = String(raw.name ?? "").trim();
  if (!name) {
    errors.push({ row: rowIndex, field: "name", message: "Name is required" });
  } else {
    valid.name = name;
  }

  // birthDatePlace
  const birthDatePlace = String(raw.birthDatePlace ?? "").trim();
  if (!DATE_PLACE_RE.test(birthDatePlace)) {
    errors.push({ row: rowIndex, field: "birthDatePlace", message: `Invalid birthDatePlace "${birthDatePlace}" — expected "<Place>, DD-MM-YYYY"` });
  } else {
    valid.birthDatePlace = birthDatePlace;
    // Also derive individual fields
    const commaIdx = birthDatePlace.lastIndexOf(",");
    valid.birthPlace = birthDatePlace.slice(0, commaIdx).trim();
    valid.birthDate = birthDatePlace.slice(commaIdx + 1).trim();
  }

  // gender
  const gender = String(raw.gender ?? "").trim().toUpperCase();
  if (!VALID_GENDERS.has(gender)) {
    errors.push({ row: rowIndex, field: "gender", message: `Invalid gender "${raw.gender}" — must be LAKI-LAKI or PEREMPUAN` });
  } else {
    valid.gender = gender as "LAKI-LAKI" | "PEREMPUAN";
  }

  // address
  const address = String(raw.address ?? "").trim();
  if (!address) {
    errors.push({ row: rowIndex, field: "address", message: "Address is required" });
  } else {
    valid.address = address;
  }

  // rtRw
  const rtRw = String(raw.rtRw ?? "").trim();
  if (!RTRTW_RE.test(rtRw)) {
    errors.push({ row: rowIndex, field: "rtRw", message: `Invalid RT/RW "${rtRw}" — expected "NNN/NNN"` });
  } else {
    valid.rtRw = rtRw;
    const [rt, rw] = rtRw.split("/");
    valid.rt = rt ?? "";
    valid.rw = rw ?? "";
  }

  // village, district, city, province
  for (const key of ["village", "district", "city", "province"] as const) {
    const value = String(raw[key] ?? "").trim();
    if (!value) {
      errors.push({ row: rowIndex, field: key, message: `${key} is required` });
    } else {
      valid[key] = value;
    }
  }

  // religion
  const religion = String(raw.religion ?? "").trim().toUpperCase();
  if (!VALID_RELIGIONS.has(religion)) {
    errors.push({ row: rowIndex, field: "religion", message: `Invalid religion "${raw.religion}"` });
  } else {
    valid.religion = religion;
  }

  // bloodType
  const bloodType = String(raw.bloodType ?? "").trim().toUpperCase();
  if (!VALID_BLOOD_TYPES.has(bloodType)) {
    errors.push({ row: rowIndex, field: "bloodType", message: `Invalid blood type "${raw.bloodType}"` });
  } else {
    valid.bloodType = bloodType;
  }

  // nationality (always WNI, but accept import)
  valid.nationality = "WNI";

  return { valid, errors, warnings };
}

// ---------------------------------------------------------------------------
// KTP parse
// ---------------------------------------------------------------------------

export function parseKtpCsvRows(
  csvText: string,
  { strict = false }: { strict?: boolean } = {},
): CsvParseResult<KTPGeneratedData> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  const rows: KTPGeneratedData[] = [];
  const errors: CsvParseError[] = [];
  const warnings: CsvParseWarning[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i]!;
    const rowIndex = i + 2; // 1-indexed + 1 for header

    const { valid, errors: rowErrors, warnings: rowWarnings } = validateCommon(raw, rowIndex, strict);
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);

    // maritalStatus
    const maritalStatus = String(raw.maritalStatus ?? "").trim().toUpperCase();
    if (!VALID_MARITAL_STATUSES.has(maritalStatus)) {
      errors.push({ row: rowIndex, field: "maritalStatus", message: `Invalid marital status "${raw.maritalStatus}"` });
    } else {
      valid.maritalStatus = maritalStatus;
    }

    // occupation
    const occupation = String(raw.occupation ?? "").trim();
    if (!occupation) {
      errors.push({ row: rowIndex, field: "occupation", message: "Occupation is required" });
    } else {
      valid.occupation = occupation;
    }

    // validityPeriod (KTP is always SEUMUR HIDUP)
    valid.validityPeriod = "SEUMUR HIDUP";

    if (rowErrors.length === 0 && valid.nik) {
      rows.push(valid as KTPGeneratedData);
    }
  }

  return { rows, errors, warnings };
}

// ---------------------------------------------------------------------------
// KTA parse
// ---------------------------------------------------------------------------

export function parseKtaCsvRows(
  csvText: string,
  { strict = false }: { strict?: boolean } = {},
): CsvParseResult<KTAGeneratedData> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  const rows: KTAGeneratedData[] = [];
  const errors: CsvParseError[] = [];
  const warnings: CsvParseWarning[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i]!;
    const rowIndex = i + 2;

    const { valid, errors: rowErrors, warnings: rowWarnings } = validateCommon(raw, rowIndex, strict);
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);

    // familyCertificateNumber
    const familyCertificateNumber = parseExcelNik(String(raw.familyCertificateNumber ?? "").trim());
    if (!familyCertificateNumber) {
      errors.push({ row: rowIndex, field: "familyCertificateNumber", message: "Family certificate number is required" });
    } else {
      valid.familyCertificateNumber = familyCertificateNumber;
    }

    // headFamilyName
    const headFamilyName = String(raw.headFamilyName ?? "").trim();
    if (!headFamilyName) {
      errors.push({ row: rowIndex, field: "headFamilyName", message: "Head of family name is required" });
    } else {
      valid.headFamilyName = headFamilyName;
    }

    // birthCertificateNumber
    const birthCertificateNumber = String(raw.birthCertificateNumber ?? "").trim();
    if (!birthCertificateNumber) {
      errors.push({ row: rowIndex, field: "birthCertificateNumber", message: "Birth certificate number is required" });
    } else {
      valid.birthCertificateNumber = birthCertificateNumber;
    }

    // validityPeriod — derive from birthDatePlace when missing or "SEUMUR HIDUP"
    let validityPeriod = String(raw.validityPeriod ?? "").trim();
    if (!validityPeriod || validityPeriod.toUpperCase() === "SEUMUR HIDUP") {
      // Attempt to derive from birthDatePlace if parsed
      if (valid.birthDate) {
        const [dd, mm, yyyy] = valid.birthDate.split("-").map(Number);
        if (dd && mm && yyyy) {
          const expires = new Date(Date.UTC(yyyy + 17, (mm ?? 1) - 1, dd));
          const padZ = (n: number) => String(n).padStart(2, "0");
          validityPeriod = `${padZ(expires.getUTCDate())}-${padZ(expires.getUTCMonth() + 1)}-${expires.getUTCFullYear()}`;
          warnings.push({ row: rowIndex, field: "validityPeriod", message: `Derived validityPeriod "${validityPeriod}" from birth date` });
        }
      }
      if (!validityPeriod || validityPeriod.toUpperCase() === "SEUMUR HIDUP") {
        errors.push({ row: rowIndex, field: "validityPeriod", message: "KTA validity period must be a date (derived from birth date)" });
      } else {
        valid.validityPeriod = validityPeriod;
      }
    } else {
      valid.validityPeriod = validityPeriod;
    }

    if (rowErrors.length === 0 && valid.nik) {
      rows.push(valid as KTAGeneratedData);
    }
  }

  return { rows, errors, warnings };
}

// ---------------------------------------------------------------------------
// CSV serialization
// ---------------------------------------------------------------------------

/** Serialize KTP rows to CSV text with Excel-safe NIK formulas. */
export function serializeKtpRows(rows: KTPGeneratedData[]): string {
  const data = rows.map((row) =>
    KTP_CSV_COLUMNS.map((col) => (col === "nik" ? toExcelNik(row[col]) : row[col])),
  );
  return Papa.unparse({ fields: [...KTP_CSV_COLUMNS], data });
}

/** Serialize KTA rows to CSV text with Excel-safe NIK + family certificate. */
export function serializeKtaRows(rows: KTAGeneratedData[]): string {
  const data = rows.map((row) => {
    const excelled: string[] = [];
    for (const col of KTA_CSV_COLUMNS) {
      const value = row[col];
      if (col === "nik" || col === "familyCertificateNumber") {
        excelled.push(toExcelNik(String(value)));
      } else {
        excelled.push(String(value));
      }
    }
    return excelled;
  });
  return Papa.unparse({ fields: [...KTA_CSV_COLUMNS], data });
}

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

/** Generate a KTP CSV template string with headers + one example row. */
export function generateKtpTemplate(): string {
  const exampleRow: KTPGeneratedData = {
    nik: "3201234567890123",
    name: "CONTOH NAMA LENGKAP",
    birthPlace: "JAKARTA",
    birthDate: "15-05-1990",
    birthDatePlace: "JAKARTA, 15-05-1990",
    gender: "LAKI-LAKI",
    address: "JL. SUDIRMAN NO. 123",
    rt: "001",
    rw: "002",
    rtRw: "001/002",
    village: "KEBAYORAN BARU",
    district: "KEBAYORAN BARU",
    city: "JAKARTA SELATAN",
    province: "DKI JAKARTA",
    religion: "ISLAM",
    maritalStatus: "BELUM KAWIN",
    occupation: "KARYAWAN SWASTA",
    bloodType: "A+",
    nationality: "WNI",
    validityPeriod: "SEUMUR HIDUP",
  };
  return serializeKtpRows([exampleRow]);
}

/** Generate a KTA CSV template string with headers + one example row. */
export function generateKtaTemplate(): string {
  const exampleRow: KTAGeneratedData = {
    nik: "3201234567890124",
    name: "CONTOH ANAK",
    birthPlace: "BANDUNG",
    birthDate: "20-08-2010",
    birthDatePlace: "BANDUNG, 20-08-2010",
    gender: "PEREMPUAN",
    address: "JL. ASIA AFRIKA NO. 456",
    rt: "003",
    rw: "004",
    rtRw: "003/004",
    village: "BRAGA",
    district: "SUMUR BANDUNG",
    city: "BANDUNG",
    province: "JAWA BARAT",
    religion: "ISLAM",
    bloodType: "B-",
    nationality: "WNI",
    validityPeriod: "20-08-2027",
    familyCertificateNumber: "3201012345678901",
    headFamilyName: "CONTOH KEPALA KELUARGA",
    birthCertificateNumber: "3201-LT-20082010-0001",
  };
  return serializeKtaRows([exampleRow]);
}

/** Parse CSV text based on card type. */
export function parseCsvRows(
  csvText: string,
  cardType: CardType,
  options?: { strict?: boolean },
): CsvParseResult<KTPGeneratedData> | CsvParseResult<KTAGeneratedData> {
  return cardType === "KTP"
    ? parseKtpCsvRows(csvText, options)
    : parseKtaCsvRows(csvText, options);
}
