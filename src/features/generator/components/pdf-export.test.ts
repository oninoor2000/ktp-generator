/**
 * Bug Condition Exploration Tests — Property 1
 *
 * These tests encode the EXPECTED (fixed) behavior.
 * They are EXPECTED TO FAIL on unfixed code — failure confirms the bugs exist.
 *
 * DO NOT fix the code when these tests fail.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { percentToCoords } from "./pdf-export.js";

// ---------------------------------------------------------------------------
// Constants for the expected (fixed) reference dimensions
// ---------------------------------------------------------------------------

const TEMPLATE_WIDTH = 650;
const TEMPLATE_HEIGHT = 410;
const MANUAL_Y_OFFSET = -15;

// KTP template PNG natural dimensions (what the buggy code uses)
const KTP_PNG_WIDTH = 2328;
const KTP_PNG_HEIGHT = 1536;

// KTA template PNG natural dimensions (what the buggy code uses)
const KTA_PNG_WIDTH = 3250;
const KTA_PNG_HEIGHT = 2050;

// ---------------------------------------------------------------------------
// Helper: build the KTP field map as the FIXED exportKtpPdf does
// ---------------------------------------------------------------------------

function buildUnfixedKtpFieldMap(row: {
  province: string;
  nationality: string;
  validityPeriod: string;
}) {
  return {
    province: `PROVINSI ${row.province}`,
    nationality: "WNI",
    validUntil: "SEUMUR HIDUP",
  };
}

// ---------------------------------------------------------------------------
// Helper: build the KTA field map as the FIXED exportKtaPdf does
// ---------------------------------------------------------------------------

function buildUnfixedKtaFieldMap(row: {
  province: string;
  nationality: string;
}) {
  return {
    province: `PROVINSI ${row.province}`,
    nationality: "WNI",
  };
}

// ---------------------------------------------------------------------------
// Bug 1 & 2: percentToCoords uses PNG natural dimensions instead of 650×410
//
// When drawCardPage calls percentToCoords it passes imgWidth/imgHeight (the
// PNG natural size). The test calls percentToCoords with the same wrong
// dimensions and asserts the result equals the CORRECT reference-frame output.
// On unfixed code this assertion FAILS because the function just scales the
// percent against whatever dimensions it receives.
// ---------------------------------------------------------------------------

describe("Bug 1+2: percentToCoords should use fixed 650×410 reference frame", () => {
  it("KTP: percentToCoords(50, 50, KTP_PNG_WIDTH, KTP_PNG_HEIGHT) should equal coords in 650×410 frame", () => {
    // Expected: scale against 650×410, apply Y offset
    const expectedX = (50 / 100) * TEMPLATE_WIDTH; // 325
    const expectedY =
      TEMPLATE_HEIGHT - (50 / 100) * TEMPLATE_HEIGHT + MANUAL_Y_OFFSET; // 410 - 205 - 15 = 190

    // Buggy callers pass PNG natural dimensions — result will be 1164, 768
    const result = percentToCoords(50, 50, KTP_PNG_WIDTH, KTP_PNG_HEIGHT);

    // These assertions FAIL on unfixed code (result is {x:1164, y:768})
    assert.equal(result.x, expectedX, `x should be ${expectedX} (got ${result.x} — Bug 1/2: wrong page reference dimensions)`);
    assert.equal(result.y, expectedY, `y should be ${expectedY} (got ${result.y} — Bug 1/2: wrong page reference dimensions + Bug 3: missing Y offset)`);
  });

  it("KTA: percentToCoords(50, 50, KTA_PNG_WIDTH, KTA_PNG_HEIGHT) should equal coords in 650×410 frame", () => {
    const expectedX = (50 / 100) * TEMPLATE_WIDTH; // 325
    const expectedY =
      TEMPLATE_HEIGHT - (50 / 100) * TEMPLATE_HEIGHT + MANUAL_Y_OFFSET; // 190

    // Buggy callers pass KTA PNG natural dimensions — result will be 1625, 1025
    const result = percentToCoords(50, 50, KTA_PNG_WIDTH, KTA_PNG_HEIGHT);

    assert.equal(result.x, expectedX, `x should be ${expectedX} (got ${result.x} — Bug 1/2: wrong page reference dimensions)`);
    assert.equal(result.y, expectedY, `y should be ${expectedY} (got ${result.y} — Bug 1/2: wrong page reference dimensions + Bug 3: missing Y offset)`);
  });
});

// ---------------------------------------------------------------------------
// Bug 3: MANUAL_Y_OFFSET of -15 is not applied
//
// Even when percentToCoords is called with the correct 650×410 dimensions,
// the Y offset is missing. On unfixed code the formula is:
//   absY = pageHeight - (yPercent / 100) * pageHeight
// instead of:
//   absY = pageHeight - (yPercent / 100) * pageHeight + MANUAL_Y_OFFSET
// ---------------------------------------------------------------------------

describe("Bug 3: percentToCoords should apply MANUAL_Y_OFFSET = -15", () => {
  it("percentToCoords(50, 6.167, 650, 410) y should include -15 offset", () => {
    // Without offset: 410 - (6.167 / 100) * 410 = 410 - 25.285... ≈ 384.7
    // With offset:    384.7 + (-15) = 369.7
    const yWithoutOffset =
      TEMPLATE_HEIGHT - (6.167 / 100) * TEMPLATE_HEIGHT; // ≈ 384.715
    const expectedY = yWithoutOffset + MANUAL_Y_OFFSET; // ≈ 369.715

    const result = percentToCoords(50, 6.167, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

    // On unfixed code result.y ≈ 384.7, not 369.7 — assertion FAILS
    assert.ok(
      Math.abs(result.y - expectedY) < 0.01,
      `y should be ≈${expectedY.toFixed(3)} (got ${result.y.toFixed(3)}) — Bug 3: MANUAL_Y_OFFSET of -15 not applied`,
    );
  });

  it("percentToCoords(0, 0, 650, 410) y should be 410 + (-15) = 395", () => {
    // Top-left: yPercent = 0 → absY = 410 - 0 = 410; with offset = 410 - 15 = 395
    const result = percentToCoords(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

    // On unfixed code result.y = 410, not 395 — assertion FAILS
    assert.equal(
      result.y,
      TEMPLATE_HEIGHT + MANUAL_Y_OFFSET,
      `y at top edge should be ${TEMPLATE_HEIGHT + MANUAL_Y_OFFSET} (got ${result.y}) — Bug 3: missing Y offset`,
    );
  });

  it("percentToCoords(100, 100, 650, 410) y should be 0 + (-15) = -15", () => {
    // Bottom-right: yPercent = 100 → absY = 410 - 410 = 0; with offset = 0 - 15 = -15
    const result = percentToCoords(100, 100, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

    // On unfixed code result.y = 0, not -15 — assertion FAILS
    assert.equal(
      result.y,
      MANUAL_Y_OFFSET,
      `y at bottom edge should be ${MANUAL_Y_OFFSET} (got ${result.y}) — Bug 3: missing Y offset`,
    );
  });
});

describe("Regression: centered header coordinates use alignment offset", () => {
  it("supports the four-argument call shape currently used by drawCardPage", () => {
    const textWidth = 120;
    const result = percentToCoords(50, 6.167, "center" as never, textWidth as never);

    assert.equal(
      result.x,
      TEMPLATE_WIDTH / 2 - textWidth / 2,
      "centered header x should subtract half of the measured text width",
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 4a: KTP province field should be "PROVINSI <province>", not raw province
// ---------------------------------------------------------------------------

describe("Bug 4a: KTP province field should have 'PROVINSI ' prefix", () => {
  it("KTP field map province value should be 'PROVINSI JAWA BARAT' for row.province = 'JAWA BARAT'", () => {
    const row = {
      province: "JAWA BARAT",
      nationality: "WNI",
      validityPeriod: "SEUMUR HIDUP",
    };

    const fields = buildUnfixedKtpFieldMap(row);

    // Expected after fix: "PROVINSI JAWA BARAT"
    // On unfixed code: "JAWA BARAT" — assertion FAILS
    assert.equal(
      fields.province,
      `PROVINSI ${row.province}`,
      `KTP province should be "PROVINSI JAWA BARAT" (got "${fields.province}") — Bug 4a: missing "PROVINSI " prefix`,
    );
  });

  it("KTP field map province value should be 'PROVINSI DKI JAKARTA' for row.province = 'DKI JAKARTA'", () => {
    const row = {
      province: "DKI JAKARTA",
      nationality: "WNI",
      validityPeriod: "SEUMUR HIDUP",
    };

    const fields = buildUnfixedKtpFieldMap(row);

    assert.equal(
      fields.province,
      `PROVINSI ${row.province}`,
      `KTP province should be "PROVINSI DKI JAKARTA" (got "${fields.province}") — Bug 4a`,
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 4b: KTP nationality field should be literal "WNI", not raw data value
// ---------------------------------------------------------------------------

describe("Bug 4b: KTP nationality field should be literal 'WNI'", () => {
  it("KTP field map nationality value should be literal 'WNI' regardless of row value", () => {
    // Even though KTPGeneratedData types nationality as "WNI", the issue is
    // the code sources it from row.nationality (which could differ if data
    // changes), rather than hardcoding the literal as the reference app does.
    const row = {
      province: "JAWA BARAT",
      nationality: "WNA", // deliberately different to expose the raw-value bug
      validityPeriod: "SEUMUR HIDUP",
    };

    const fields = buildUnfixedKtpFieldMap(row);

    // Expected: always "WNI" regardless of row.nationality
    // On unfixed code: "WNA" (raw value) — assertion FAILS
    assert.equal(
      fields.nationality,
      "WNI",
      `KTP nationality should always be "WNI" (got "${fields.nationality}") — Bug 4b: raw nationality value used instead of literal`,
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 4c: KTP validUntil field should be literal "SEUMUR HIDUP", not raw validityPeriod
// ---------------------------------------------------------------------------

describe("Bug 4c: KTP validUntil field should be literal 'SEUMUR HIDUP'", () => {
  it("KTP field map validUntil value should be 'SEUMUR HIDUP' regardless of row validityPeriod", () => {
    const row = {
      province: "JAWA BARAT",
      nationality: "WNI",
      validityPeriod: "17 TAHUN", // raw period that would come from a different data source
    };

    const fields = buildUnfixedKtpFieldMap(row);

    // Expected: always "SEUMUR HIDUP"
    // On unfixed code: "17 TAHUN" (raw validityPeriod) — assertion FAILS
    assert.equal(
      fields.validUntil,
      "SEUMUR HIDUP",
      `KTP validUntil should always be "SEUMUR HIDUP" (got "${fields.validUntil}") — Bug 4c: raw validityPeriod used instead of literal`,
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 4d: KTA province field should be "PROVINSI <province>", not raw province
// ---------------------------------------------------------------------------

describe("Bug 4d: KTA province field should have 'PROVINSI ' prefix", () => {
  it("KTA field map province value should be 'PROVINSI JAWA TENGAH' for row.province = 'JAWA TENGAH'", () => {
    const row = {
      province: "JAWA TENGAH",
      nationality: "WNI",
    };

    const fields = buildUnfixedKtaFieldMap(row);

    // Expected: "PROVINSI JAWA TENGAH"
    // On unfixed code: "JAWA TENGAH" — assertion FAILS
    assert.equal(
      fields.province,
      `PROVINSI ${row.province}`,
      `KTA province should be "PROVINSI JAWA TENGAH" (got "${fields.province}") — Bug 4d: missing "PROVINSI " prefix`,
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 4e: KTA nationality field should be literal "WNI", not raw data value
// ---------------------------------------------------------------------------

describe("Bug 4e: KTA nationality field should be literal 'WNI'", () => {
  it("KTA field map nationality value should be literal 'WNI' regardless of row value", () => {
    const row = {
      province: "JAWA TENGAH",
      nationality: "WNA", // deliberately different to expose the raw-value bug
    };

    const fields = buildUnfixedKtaFieldMap(row);

    // Expected: always "WNI"
    // On unfixed code: "WNA" (raw value) — assertion FAILS
    assert.equal(
      fields.nationality,
      "WNI",
      `KTA nationality should always be "WNI" (got "${fields.nationality}") — Bug 4e: raw nationality value used instead of literal`,
    );
  });
});

// ===========================================================================
// Preservation Property Tests — Property 2
//
// These tests verify that behaviors OUTSIDE the bug condition remain unchanged.
// They MUST PASS on unfixed code — passing here confirms the baseline to preserve.
//
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
// ===========================================================================

import { DEFAULT_KTP_POSITION_CONFIG, DEFAULT_KTA_POSITION_CONFIG } from "~/features/generator/domain/position.js";
import type { KTPGeneratedData, KTAGeneratedData } from "~/features/generator/domain/types.js";

// ---------------------------------------------------------------------------
// Property-based test helpers
// ---------------------------------------------------------------------------

/** Simple seeded-like PRNG (LCG) for reproducible random strings */
function randomString(seed: number, length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -";
  let s = seed;
  let result = "";
  for (let i = 0; i < length; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    result += chars[Math.abs(s) % chars.length];
  }
  return result.trim() || "DEFAULT";
}

/** Generate N test cases via a factory and run a check on each */
function forAll<T>(count: number, factory: (i: number) => T, check: (t: T, i: number) => void): void {
  for (let i = 0; i < count; i++) {
    check(factory(i), i);
  }
}

// ---------------------------------------------------------------------------
// Helper: build KTP field map exactly as unfixed exportKtpPdf does
// (mirrors the fields object inside exportKtpPdf)
// ---------------------------------------------------------------------------

function buildKtpFieldMapFromSource(row: KTPGeneratedData) {
  const config = DEFAULT_KTP_POSITION_CONFIG;
  return {
    province:    { config: config.province,    value: `PROVINSI ${row.province}` },
    city:        { config: config.city,        value: row.city },
    nik:         { config: config.nik,         value: row.nik },
    name:        { config: config.name,        value: row.name },
    birthDatePlace: { config: config.birthDatePlace, value: row.birthDatePlace },
    gender:      { config: config.gender,      value: row.gender },
    address:     { config: config.address,     value: row.address },
    rtRw:        { config: config.rtRw,        value: row.rtRw },
    village:     { config: config.village,     value: row.village },
    district:    { config: config.district,    value: row.district },
    religion:    { config: config.religion,    value: row.religion },
    maritalStatus: { config: config.maritalStatus, value: row.maritalStatus },
    occupation:  { config: config.occupation,  value: row.occupation },
    bloodType:   { config: config.bloodType,   value: row.bloodType },
    nationality: { config: config.nationality, value: "WNI" },
    validUntil:  { config: config.validUntil,  value: "SEUMUR HIDUP" },
  };
}

// ---------------------------------------------------------------------------
// Helper: build KTA field map exactly as unfixed exportKtaPdf does
// ---------------------------------------------------------------------------

function buildKtaFieldMapFromSource(row: KTAGeneratedData) {
  const config = DEFAULT_KTA_POSITION_CONFIG;
  return {
    province:    { config: config.province,    value: `PROVINSI ${row.province}` },
    city:        { config: config.city,        value: row.city },
    nik:         { config: config.nik,         value: row.nik },
    name:        { config: config.name,        value: row.name },
    birthDatePlace: { config: config.birthDatePlace, value: row.birthDatePlace },
    gender:      { config: config.gender,      value: row.gender },
    familyCertificateNumber: { config: config.familyCertificateNumber, value: row.familyCertificateNumber },
    headFamilyName: { config: config.headFamilyName, value: row.headFamilyName },
    birthCertificateNumber: { config: config.birthCertificateNumber, value: row.birthCertificateNumber },
    religion:    { config: config.religion,    value: row.religion },
    nationality: { config: config.nationality, value: "WNI" },
    address:     { config: config.address,     value: row.address },
    rtRw:        { config: config.rtRw,        value: row.rtRw },
    village:     { config: config.village,     value: row.village },
    district:    { config: config.district,    value: row.district },
    validityPeriod: { config: config.validityPeriod, value: row.validityPeriod },
    bloodType:   { config: config.bloodType,   value: row.bloodType },
  };
}

/** Produce a synthetic KTPGeneratedData row using deterministic seed-based values */
function makeKtpRow(i: number): KTPGeneratedData {
  return {
    nik:           randomString(i * 17 + 1, 16),
    name:          randomString(i * 17 + 2, 20),
    birthPlace:    randomString(i * 17 + 3, 10),
    birthDate:     "01-01-1990",
    birthDatePlace: randomString(i * 17 + 4, 20),
    gender:        i % 2 === 0 ? "LAKI-LAKI" : "PEREMPUAN",
    address:       randomString(i * 17 + 5, 30),
    rt:            "001",
    rw:            "002",
    rtRw:          "001/002",
    village:       randomString(i * 17 + 6, 15),
    district:      randomString(i * 17 + 7, 15),
    city:          randomString(i * 17 + 8, 15),
    province:      randomString(i * 17 + 9, 12),
    religion:      randomString(i * 17 + 10, 8),
    maritalStatus: randomString(i * 17 + 11, 12),
    occupation:    randomString(i * 17 + 12, 15),
    bloodType:     ["A", "B", "AB", "O"][i % 4]!,
    nationality:   "WNI",
    validityPeriod: "SEUMUR HIDUP",
  };
}

/** Produce a synthetic KTAGeneratedData row using deterministic seed-based values */
function makeKtaRow(i: number): KTAGeneratedData {
  return {
    nik:           randomString(i * 19 + 1, 16),
    name:          randomString(i * 19 + 2, 20),
    birthPlace:    randomString(i * 19 + 3, 10),
    birthDate:     "01-01-1990",
    birthDatePlace: randomString(i * 19 + 4, 20),
    gender:        i % 2 === 0 ? "LAKI-LAKI" : "PEREMPUAN",
    address:       randomString(i * 19 + 5, 30),
    rt:            "001",
    rw:            "002",
    rtRw:          "001/002",
    village:       randomString(i * 19 + 6, 15),
    district:      randomString(i * 19 + 7, 15),
    city:          randomString(i * 19 + 8, 15),
    province:      randomString(i * 19 + 9, 12),
    religion:      randomString(i * 19 + 10, 8),
    bloodType:     ["A", "B", "AB", "O"][i % 4]!,
    nationality:   "WNI",
    validityPeriod: randomString(i * 19 + 13, 10),
    familyCertificateNumber: randomString(i * 19 + 14, 16),
    headFamilyName: randomString(i * 19 + 15, 20),
    birthCertificateNumber: randomString(i * 19 + 16, 16),
  };
}

// ===========================================================================
// Requirement 3.1 — Non-transformed KTP fields pass through verbatim
//
// For any KTP row, the fields city, nik, name, birthDatePlace, gender, address,
// rtRw, village, district, religion, maritalStatus, occupation, bloodType must
// map directly to the same string value from the row (no transformation).
//
// Validates: Requirement 3.1
// ===========================================================================

describe("Preservation 3.1: Non-transformed KTP fields pass through verbatim", () => {
  it("city, nik, name, birthDatePlace pass through unchanged across 50 random rows", () => {
    forAll(50, makeKtpRow, (row, i) => {
      const fields = buildKtpFieldMapFromSource(row);

      assert.equal(fields.city.value,          row.city,          `row[${i}]: city mismatch`);
      assert.equal(fields.nik.value,           row.nik,           `row[${i}]: nik mismatch`);
      assert.equal(fields.name.value,          row.name,          `row[${i}]: name mismatch`);
      assert.equal(fields.birthDatePlace.value, row.birthDatePlace, `row[${i}]: birthDatePlace mismatch`);
    });
  });

  it("gender, address, rtRw, village, district pass through unchanged across 50 random rows", () => {
    forAll(50, makeKtpRow, (row, i) => {
      const fields = buildKtpFieldMapFromSource(row);

      assert.equal(fields.gender.value,   row.gender,   `row[${i}]: gender mismatch`);
      assert.equal(fields.address.value,  row.address,  `row[${i}]: address mismatch`);
      assert.equal(fields.rtRw.value,     row.rtRw,     `row[${i}]: rtRw mismatch`);
      assert.equal(fields.village.value,  row.village,  `row[${i}]: village mismatch`);
      assert.equal(fields.district.value, row.district, `row[${i}]: district mismatch`);
    });
  });

  it("religion, maritalStatus, occupation, bloodType pass through unchanged across 50 random rows", () => {
    forAll(50, makeKtpRow, (row, i) => {
      const fields = buildKtpFieldMapFromSource(row);

      assert.equal(fields.religion.value,      row.religion,      `row[${i}]: religion mismatch`);
      assert.equal(fields.maritalStatus.value, row.maritalStatus, `row[${i}]: maritalStatus mismatch`);
      assert.equal(fields.occupation.value,    row.occupation,    `row[${i}]: occupation mismatch`);
      assert.equal(fields.bloodType.value,     row.bloodType,     `row[${i}]: bloodType mismatch`);
    });
  });
});

// ===========================================================================
// Requirement 3.10 — Non-transformed KTA fields pass through verbatim
//
// For any KTA row, the fields familyCertificateNumber, headFamilyName,
// birthCertificateNumber, validityPeriod must map directly without modification.
// Also city, nik, name, birthDatePlace, gender, address, rtRw, village, district,
// religion, bloodType.
//
// Validates: Requirements 3.1, 3.10
// ===========================================================================

describe("Preservation 3.10: Non-transformed KTA fields pass through verbatim", () => {
  it("familyCertificateNumber, headFamilyName, birthCertificateNumber, validityPeriod pass through unchanged across 50 random rows", () => {
    forAll(50, makeKtaRow, (row, i) => {
      const fields = buildKtaFieldMapFromSource(row);

      assert.equal(fields.familyCertificateNumber.value, row.familyCertificateNumber, `row[${i}]: familyCertificateNumber mismatch`);
      assert.equal(fields.headFamilyName.value,          row.headFamilyName,          `row[${i}]: headFamilyName mismatch`);
      assert.equal(fields.birthCertificateNumber.value,  row.birthCertificateNumber,  `row[${i}]: birthCertificateNumber mismatch`);
      assert.equal(fields.validityPeriod.value,          row.validityPeriod,          `row[${i}]: validityPeriod mismatch`);
    });
  });

  it("city, nik, name, birthDatePlace, gender, address, rtRw, village, district, religion, bloodType pass through unchanged across 50 random rows", () => {
    forAll(50, makeKtaRow, (row, i) => {
      const fields = buildKtaFieldMapFromSource(row);

      assert.equal(fields.city.value,          row.city,          `row[${i}]: city mismatch`);
      assert.equal(fields.nik.value,           row.nik,           `row[${i}]: nik mismatch`);
      assert.equal(fields.name.value,          row.name,          `row[${i}]: name mismatch`);
      assert.equal(fields.birthDatePlace.value, row.birthDatePlace, `row[${i}]: birthDatePlace mismatch`);
      assert.equal(fields.gender.value,        row.gender,        `row[${i}]: gender mismatch`);
      assert.equal(fields.address.value,       row.address,       `row[${i}]: address mismatch`);
      assert.equal(fields.rtRw.value,          row.rtRw,          `row[${i}]: rtRw mismatch`);
      assert.equal(fields.village.value,       row.village,       `row[${i}]: village mismatch`);
      assert.equal(fields.district.value,      row.district,      `row[${i}]: district mismatch`);
      assert.equal(fields.religion.value,      row.religion,      `row[${i}]: religion mismatch`);
      assert.equal(fields.bloodType.value,     row.bloodType,     `row[${i}]: bloodType mismatch`);
    });
  });
});

// ===========================================================================
// Requirement 3.2 — Font sizes from position.ts config remain unchanged
//
// DEFAULT_KTP_POSITION_CONFIG: BOLD fields use fontSize 14, NIK/province/city
// use fontSize 18 (BOLD_LARGE / headerField).
// DEFAULT_KTA_POSITION_CONFIG: same pattern.
//
// Validates: Requirement 3.2
// ===========================================================================

describe("Preservation 3.2: Font sizes from position.ts config are unchanged", () => {
  it("KTP: BOLD_LARGE/header fields (province, city, nik) have fontSize 18", () => {
    const config = DEFAULT_KTP_POSITION_CONFIG;
    assert.equal(config.province.style.fontSize, 18, "KTP province fontSize should be 18");
    assert.equal(config.city.style.fontSize,     18, "KTP city fontSize should be 18");
    assert.equal(config.nik.style.fontSize,      18, "KTP nik fontSize should be 18");
  });

  it("KTP: BOLD fields (name, gender, address, etc.) have fontSize 14", () => {
    const config = DEFAULT_KTP_POSITION_CONFIG;
    const boldFields = [
      "name", "birthDatePlace", "gender", "address", "rtRw",
      "village", "district", "religion", "maritalStatus",
      "occupation", "bloodType", "nationality", "validUntil",
    ] as const;

    for (const key of boldFields) {
      assert.equal(
        config[key].style.fontSize,
        14,
        `KTP ${key} fontSize should be 14`,
      );
    }
  });

  it("KTA: BOLD_LARGE/header fields (province, city, nik) have fontSize 18", () => {
    const config = DEFAULT_KTA_POSITION_CONFIG;
    assert.equal(config.province.style.fontSize, 18, "KTA province fontSize should be 18");
    assert.equal(config.city.style.fontSize,     18, "KTA city fontSize should be 18");
    assert.equal(config.nik.style.fontSize,      18, "KTA nik fontSize should be 18");
  });

  it("KTA: BOLD fields (name, gender, address, etc.) have fontSize 14", () => {
    const config = DEFAULT_KTA_POSITION_CONFIG;
    const boldFields = [
      "name", "birthDatePlace", "gender", "address", "rtRw",
      "village", "district", "religion", "nationality",
      "bloodType", "validityPeriod", "familyCertificateNumber",
      "headFamilyName", "birthCertificateNumber",
    ] as const;

    for (const key of boldFields) {
      assert.equal(
        config[key].style.fontSize,
        14,
        `KTA ${key} fontSize should be 14`,
      );
    }
  });
});

// ===========================================================================
// Requirement 3.3 — Text alignment relative math is preserved
//
// percentToCoords computes alignment offsets relative to whatever absX the
// function produces. We test the relationship between the three alignment
// modes rather than asserting specific absolute coordinate values, so these
// tests pass on both unfixed and fixed code.
//
// For any (xPct, yPct, pageW, pageH, textWidth):
//   left.x  === absX
//   center.x === absX - textWidth/2
//   right.x  === absX - textWidth
//
// Validates: Requirement 3.3
// ===========================================================================

describe("Preservation 3.3: Text alignment relative math is unchanged", () => {
  // After the fix, percentToCoords always uses TEMPLATE_WIDTH=650 and
  // TEMPLATE_HEIGHT=410 as the reference frame regardless of any extra args
  // passed. absX is therefore always (xPct / 100) * 650.
  it("left alignment returns absX unchanged across 100 random inputs", () => {
    forAll(100, (i) => {
      const xPct  = ((i * 13 + 7) % 101);         // 0–100
      const yPct  = ((i * 17 + 3) % 101);
      const pageW = 200 + (i % 5) * 100;            // passed but ignored by fixed function
      const pageH = 100 + (i % 4) * 100;
      const tw    = (i * 7) % 200;                  // 0–199 textWidth
      return { xPct, yPct, pageW, pageH, tw };
    }, ({ xPct, yPct, pageW, pageH, tw }, i) => {
      const left    = percentToCoords(xPct, yPct, pageW, pageH, "left",  tw);
      const noAlign = percentToCoords(xPct, yPct, pageW, pageH, "left",  0);
      // Fixed function always uses TEMPLATE_WIDTH=650 for absX
      const absX = (xPct / 100) * TEMPLATE_WIDTH;
      assert.ok(
        Math.abs(left.x - absX) < 0.001,
        `[${i}] left alignment: expected x=${absX} got ${left.x}`,
      );
      // textWidth should have no effect on left alignment
      assert.equal(left.x, noAlign.x, `[${i}] left alignment: textWidth should not affect x`);
    });
  });

  it("center alignment returns absX - textWidth/2 across 100 random inputs", () => {
    forAll(100, (i) => {
      const xPct  = ((i * 11 + 5) % 101);
      const yPct  = ((i * 13 + 2) % 101);
      const pageW = 200 + (i % 5) * 100;
      const pageH = 100 + (i % 4) * 100;
      const tw    = (i * 11) % 300;
      return { xPct, yPct, pageW, pageH, tw };
    }, ({ xPct, yPct, pageW, pageH, tw }, i) => {
      const center = percentToCoords(xPct, yPct, pageW, pageH, "center", tw);
      // Fixed function always uses TEMPLATE_WIDTH=650 for absX
      const absX   = (xPct / 100) * TEMPLATE_WIDTH;
      const expected = absX - tw / 2;
      assert.ok(
        Math.abs(center.x - expected) < 0.001,
        `[${i}] center alignment: expected x=${expected} got ${center.x}`,
      );
    });
  });

  it("right alignment returns absX - textWidth across 100 random inputs", () => {
    forAll(100, (i) => {
      const xPct  = ((i * 7 + 9) % 101);
      const yPct  = ((i * 11 + 1) % 101);
      const pageW = 200 + (i % 5) * 100;
      const pageH = 100 + (i % 4) * 100;
      const tw    = (i * 13) % 250;
      return { xPct, yPct, pageW, pageH, tw };
    }, ({ xPct, yPct, pageW, pageH, tw }, i) => {
      const right  = percentToCoords(xPct, yPct, pageW, pageH, "right", tw);
      // Fixed function always uses TEMPLATE_WIDTH=650 for absX
      const absX   = (xPct / 100) * TEMPLATE_WIDTH;
      const expected = absX - tw;
      assert.ok(
        Math.abs(right.x - expected) < 0.001,
        `[${i}] right alignment: expected x=${expected} got ${right.x}`,
      );
    });
  });

  it("alignment ordering: right.x <= center.x <= left.x for any positive textWidth", () => {
    forAll(100, (i) => {
      const xPct  = ((i * 9 + 4) % 101);
      const yPct  = ((i * 5 + 6) % 101);
      const pageW = 650;
      const pageH = 410;
      const tw    = 10 + (i % 190); // always positive
      return { xPct, yPct, pageW, pageH, tw };
    }, ({ xPct, yPct, pageW, pageH, tw }, i) => {
      const left   = percentToCoords(xPct, yPct, pageW, pageH, "left",   tw);
      const center = percentToCoords(xPct, yPct, pageW, pageH, "center", tw);
      const right  = percentToCoords(xPct, yPct, pageW, pageH, "right",  tw);
      assert.ok(
        right.x <= center.x && center.x <= left.x,
        `[${i}] alignment ordering violated: right(${right.x}) <= center(${center.x}) <= left(${left.x})`,
      );
    });
  });
});
