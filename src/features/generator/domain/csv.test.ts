import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  generateKtpTemplate,
  generateKtaTemplate,
  parseKtpCsvRows,
  parseKtaCsvRows,
  serializeKtpRows,
  serializeKtaRows,
  toExcelNik,
  parseExcelNik,
  KTP_CSV_COLUMNS,
  KTA_CSV_COLUMNS,
} from "./csv";
import type { KTPGeneratedData, KTAGeneratedData } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_KTP: KTPGeneratedData = {
  nik: "3201234567890123",
  name: "AHMAD WIJAYA",
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

const BASE_KTA: KTAGeneratedData = {
  nik: "3201234567890124",
  name: "SITI NURHALIZA",
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
  headFamilyName: "AHMAD WIJAYA",
  birthCertificateNumber: "3201-LT-20082010-0001",
};

// ---------------------------------------------------------------------------
// Excel NIK helpers
// ---------------------------------------------------------------------------

describe("toExcelNik / parseExcelNik", () => {
  test("toExcelNik wraps NIK in Excel formula", () => {
    assert.equal(toExcelNik("3201234567890123"), '="3201234567890123"');
  });

  test("parseExcelNik parses Excel formula", () => {
    assert.equal(parseExcelNik('="3201234567890123"'), "3201234567890123");
  });

  test("parseExcelNik parses plain 16-digit NIK", () => {
    assert.equal(parseExcelNik("3201234567890123"), "3201234567890123");
  });

  test("parseExcelNik returns raw for non-NIK", () => {
    assert.equal(parseExcelNik("short"), "short");
  });
});

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

describe("generateKtpTemplate", () => {
  test("generates KTP template with expected headers", () => {
    const csv = generateKtpTemplate();
    const firstLine = csv.split("\n")[0] ?? "";
    for (const col of KTP_CSV_COLUMNS) {
      assert.ok(firstLine.includes(col), `Missing column: ${col}`);
    }
  });

  test("KTP template has exactly one data row", () => {
    const csv = generateKtpTemplate();
    const lines = csv.split("\n").filter((l) => l.trim());
    assert.equal(lines.length, 2); // header + 1 row
  });
});

describe("generateKtaTemplate", () => {
  test("generates KTA template with expected headers", () => {
    const csv = generateKtaTemplate();
    const firstLine = csv.split("\n")[0] ?? "";
    for (const col of KTA_CSV_COLUMNS) {
      assert.ok(firstLine.includes(col), `Missing column: ${col}`);
    }
  });

  test("KTA template has exactly one data row", () => {
    const csv = generateKtaTemplate();
    const lines = csv.split("\n").filter((l) => l.trim());
    assert.equal(lines.length, 2);
  });
});

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

describe("serializeKtpRows", () => {
  test("serializes KTP rows with Excel-safe NIK", () => {
    const csv = serializeKtpRows([BASE_KTP]);
    // PapaParse wraps the Excel formula in quotes and escapes inner quotes.
    // The raw text will contain the escaped form.
    assert.ok(
      csv.includes("3201234567890123"),
      "CSV should contain the NIK digits",
    );
    // Round-trip: parse back and confirm NIK is intact
    const result = parseKtpCsvRows(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows[0]?.nik, "3201234567890123");
    assert.ok(csv.includes("AHMAD WIJAYA"));
  });

  test("serializes multiple KTP rows", () => {
    const csv = serializeKtpRows([BASE_KTP, { ...BASE_KTP, nik: "3201234567890124", name: "BUDI" }]);
    const lines = csv.split("\n").filter((l) => l.trim());
    assert.equal(lines.length, 3); // header + 2 rows
  });
});

describe("serializeKtaRows", () => {
  test("serializes KTA rows with Excel-safe NIK and family certificate number", () => {
    const csv = serializeKtaRows([BASE_KTA]);
    // Verify round-trip integrity
    const result = parseKtaCsvRows(csv);
    assert.equal(result.errors.length, 0, `Errors: ${result.errors.map((e) => e.message).join(", ")}`);
    assert.equal(result.rows[0]?.nik, "3201234567890124");
    assert.equal(result.rows[0]?.familyCertificateNumber, "3201012345678901");
    assert.ok(csv.includes("SITI NURHALIZA"));
  });
});

// ---------------------------------------------------------------------------
// KTP CSV parsing
// ---------------------------------------------------------------------------

describe("parseKtpCsvRows", () => {
  test("imports valid KTP CSV", () => {
    const csv = serializeKtpRows([BASE_KTP]);
    const result = parseKtpCsvRows(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.nik, "3201234567890123");
    assert.equal(result.rows[0]?.gender, "LAKI-LAKI");
  });

  test("parses Excel-safe NIK formula", () => {
    const csv = `nik,name,birthDatePlace,gender,address,rtRw,village,district,city,province,religion,maritalStatus,occupation,bloodType,nationality,validityPeriod
="3201234567890123","AHMAD","JAKARTA, 15-05-1990","LAKI-LAKI","JL. A NO. 1","001/002","DESA","KEC","KOTA","PROV","ISLAM","BELUM KAWIN","WIRASWASTA","A+","WNI","SEUMUR HIDUP"`;
    const result = parseKtpCsvRows(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows[0]?.nik, "3201234567890123");
  });

  test("parses quoted comma inside address field", () => {
    const row: KTPGeneratedData = {
      ...BASE_KTP,
      address: "JL. A, BLOK B NO. 1",
    };
    const csv = serializeKtpRows([row]);
    const result = parseKtpCsvRows(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows[0]?.address, "JL. A, BLOK B NO. 1");
  });

  test("strict mode rejects invalid NIK", () => {
    const csv = `nik,name,birthDatePlace,gender,address,rtRw,village,district,city,province,religion,maritalStatus,occupation,bloodType,nationality,validityPeriod
SHORT,"AHMAD","JAKARTA, 15-05-1990","LAKI-LAKI","JL. A NO. 1","001/002","DESA","KEC","KOTA","PROV","ISLAM","BELUM KAWIN","WIRASWASTA","A+","WNI","SEUMUR HIDUP"`;
    const result = parseKtpCsvRows(csv, { strict: true });
    assert.ok(result.errors.some((e) => e.field === "nik"));
  });

  test("repair mode records warning for invalid NIK and skips row", () => {
    const csv = `nik,name,birthDatePlace,gender,address,rtRw,village,district,city,province,religion,maritalStatus,occupation,bloodType,nationality,validityPeriod
SHORT,"AHMAD","JAKARTA, 15-05-1990","LAKI-LAKI","JL. A NO. 1","001/002","DESA","KEC","KOTA","PROV","ISLAM","BELUM KAWIN","WIRASWASTA","A+","WNI","SEUMUR HIDUP"`;
    const result = parseKtpCsvRows(csv, { strict: false });
    // Row is skipped because nik fails
    assert.equal(result.rows.length, 0);
    assert.ok(result.warnings.some((w) => w.field === "nik"));
  });

  test("rejects invalid gender", () => {
    const csv = `nik,name,birthDatePlace,gender,address,rtRw,village,district,city,province,religion,maritalStatus,occupation,bloodType,nationality,validityPeriod
="3201234567890123","AHMAD","JAKARTA, 15-05-1990","PRIA","JL. A NO. 1","001/002","DESA","KEC","KOTA","PROV","ISLAM","BELUM KAWIN","WIRASWASTA","A+","WNI","SEUMUR HIDUP"`;
    const result = parseKtpCsvRows(csv);
    assert.ok(result.errors.some((e) => e.field === "gender"));
  });

  test("rejects invalid blood type", () => {
    const csv = `nik,name,birthDatePlace,gender,address,rtRw,village,district,city,province,religion,maritalStatus,occupation,bloodType,nationality,validityPeriod
="3201234567890123","AHMAD","JAKARTA, 15-05-1990","LAKI-LAKI","JL. A NO. 1","001/002","DESA","KEC","KOTA","PROV","ISLAM","BELUM KAWIN","WIRASWASTA","X","WNI","SEUMUR HIDUP"`;
    const result = parseKtpCsvRows(csv);
    assert.ok(result.errors.some((e) => e.field === "bloodType"));
  });
});

// ---------------------------------------------------------------------------
// KTA CSV parsing
// ---------------------------------------------------------------------------

describe("parseKtaCsvRows", () => {
  test("imports valid KTA CSV", () => {
    const csv = serializeKtaRows([BASE_KTA]);
    const result = parseKtaCsvRows(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.nik, "3201234567890124");
    assert.equal(result.rows[0]?.validityPeriod, "20-08-2027");
  });

  test("derives KTA validity from birth date when validityPeriod is missing", () => {
    const csv = `nik,name,birthDatePlace,gender,familyCertificateNumber,headFamilyName,birthCertificateNumber,religion,nationality,address,rtRw,village,district,province,city,validityPeriod,bloodType
="3201234567890124","SITI","BANDUNG, 20-08-2010","PEREMPUAN","3201012345678901","AHMAD","3201-LT-20082010-0001","ISLAM","WNI","JL. A NO. 1","003/004","DESA","KEC","PROV","KOTA","","B-"`;
    const result = parseKtaCsvRows(csv);
    // Should warn about derivation
    assert.ok(result.warnings.some((w) => w.field === "validityPeriod" && w.message.includes("Derived")));
    if (result.rows[0]) {
      assert.equal(result.rows[0].validityPeriod, "20-08-2027");
    }
  });

  test("rejects KTA with SEUMUR HIDUP validity and no birth date to derive from", () => {
    const csv = `nik,name,birthDatePlace,gender,familyCertificateNumber,headFamilyName,birthCertificateNumber,religion,nationality,address,rtRw,village,district,province,city,validityPeriod,bloodType
="3201234567890124","SITI","BANDUNG (INVALID DATE)","PEREMPUAN","3201012345678901","AHMAD","3201-LT-20082010-0001","ISLAM","WNI","JL. A NO. 1","003/004","DESA","KEC","PROV","KOTA","SEUMUR HIDUP","B-"`;
    const result = parseKtaCsvRows(csv);
    assert.ok(result.errors.some((e) => e.field === "validityPeriod" || e.field === "birthDatePlace"));
  });
});
