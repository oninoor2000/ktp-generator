import assert from "node:assert/strict";
import { test } from "node:test";

import { BLOOD_TYPE, JOB, MARITAL_STATUS, RELIGION } from "./constants";
import { getBirthPlace, joinRtRw } from "./format";
import {
  buildKtaRow,
  chooseGender,
  generatedGenderLabel,
  generateKtaRows,
  generateKtpRows,
  generateNik,
  makeRandomContext,
} from "./generate";
import type {
  GeneratorSettings,
  KTAGeneratedData,
  KTPGeneratedData,
  RegionalData,
} from "./types";

const REGION: RegionalData = {
  province: { id: "31", name: "DKI JAKARTA" },
  regency: { id: "3171", name: "KOTA JAKARTA PUSAT" },
  district: { id: "317101", name: "GAMBIR" },
  village: { id: "3171011001", name: "GAMBIR" },
};

function deterministicRandomSequence(values: number[]) {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
}

test("getBirthPlace strips Kabupaten prefix", () => {
  assert.equal(getBirthPlace("Kabupaten Bogor"), "BOGOR");
});

test("getBirthPlace strips Kota prefix", () => {
  assert.equal(getBirthPlace("Kota Bandung"), "BANDUNG");
});

test("getBirthPlace leaves plain names intact", () => {
  assert.equal(getBirthPlace("Aceh"), "ACEH");
});

test("joinRtRw pads to two digits", () => {
  assert.equal(joinRtRw("3", "5"), "03/05");
  assert.equal(joinRtRw("12", "07"), "12/07");
});

test("generateNik encodes male birth day without offset", () => {
  const nik = generateNik({
    provinceId: "31",
    regencyId: "3171",
    districtId: "317101",
    birthDate: new Date(Date.UTC(1990, 0, 5)),
    gender: "male",
    sequence: "1234",
  });
  assert.equal(nik, "3171010501901234");
  assert.equal(nik.length, 16);
});

test("generateNik encodes female birth day with plus 40 offset", () => {
  const nik = generateNik({
    provinceId: "31",
    regencyId: "3171",
    districtId: "317101",
    birthDate: new Date(Date.UTC(1990, 0, 5)),
    gender: "female",
    sequence: "1234",
  });
  assert.equal(nik, "3171014501901234");
});

test("generateKtpRows honors MALE gender setting", () => {
  const settings: GeneratorSettings = {
    cardType: "KTP",
    dataCount: 4,
    minAge: 18,
    maxAge: 60,
    gender: "MALE",
    provinceIds: ["31"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence([0.5, 0.5, 0.5, 0.5]));
  const rows = generateKtpRows(settings, [REGION], ctx);
  assert.equal(rows.length, 4);
  for (const row of rows) {
    assert.equal(row.gender, "LAKI-LAKI");
  }
});

test("generateKtpRows honors FEMALE gender setting", () => {
  const settings: GeneratorSettings = {
    cardType: "KTP",
    dataCount: 4,
    minAge: 18,
    maxAge: 60,
    gender: "FEMALE",
    provinceIds: ["31"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence([0.5, 0.5, 0.5, 0.5]));
  const rows = generateKtpRows(settings, [REGION], ctx);
  for (const row of rows) {
    assert.equal(row.gender, "PEREMPUAN");
    // Day offset by 40 means position 7-8 is in 41-71 range.
    const dayPart = Number(row.nik.slice(6, 8));
    assert.ok(dayPart >= 41 && dayPart <= 71, `day=${dayPart} nik=${row.nik}`);
  }
});

test("generateKtpRows sets lifetime validity and uppercase text", () => {
  const settings: GeneratorSettings = {
    cardType: "KTP",
    dataCount: 1,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence([0.4]));
  const [row] = generateKtpRows(settings, [REGION], ctx);
  assert.equal(row.validityPeriod, "SEUMUR HIDUP");
  assert.equal(row.nationality, "WNI");
  assert.equal(row.name, row.name.toUpperCase());
  assert.equal(row.province, "DKI JAKARTA");
  // city keeps the regency prefix; birth place strips it.
  assert.equal(row.city, "KOTA JAKARTA PUSAT");
  assert.equal(row.birthPlace, "JAKARTA PUSAT");
  assert.ok(RELIGION.includes(row.religion as never));
  assert.ok(MARITAL_STATUS.includes(row.maritalStatus as never));
  assert.ok(JOB.includes(row.occupation as never));
  assert.ok(BLOOD_TYPE.includes(row.bloodType as never));
});

test("generateKtaRows sets validity to 17th birthday and adds family fields", () => {
  const settings: GeneratorSettings = {
    cardType: "KTA",
    dataCount: 1,
    minAge: 1,
    maxAge: 16,
    gender: "BOTH",
    provinceIds: ["31"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]));
  const [row] = generateKtaRows(settings, [REGION], ctx) as KTAGeneratedData[];
  // Birth date in DD-MM-YYYY plus 17 years.
  const [dd, mm, yyyy] = row.birthDate.split("-");
  const expectedYear = String(Number(yyyy) + 17);
  assert.ok(row.validityPeriod.endsWith(expectedYear), `validity=${row.validityPeriod}`);
  assert.equal(row.familyCertificateNumber.length, 16);
  assert.equal(row.birthCertificateNumber.length, 12);
  assert.ok(row.headFamilyName.length > 0);
});

test("generateKtpRows returns one row per request", () => {
  const settings: GeneratorSettings = {
    cardType: "KTP",
    dataCount: 25,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31", "32"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence(new Array(200).fill(0.5)));
  const rows = generateKtpRows(settings, [REGION, REGION], ctx);
  assert.equal(rows.length, 25);
});

test("chooseGender respects fixed random provider", () => {
  const alwaysLow = () => 0.1;
  const alwaysHigh = () => 0.9;
  assert.equal(chooseGender("BOTH", alwaysLow), "male");
  assert.equal(chooseGender("BOTH", alwaysHigh), "female");
  assert.equal(chooseGender("MALE", alwaysHigh), "male");
  assert.equal(chooseGender("FEMALE", alwaysLow), "female");
});

test("generatedGenderLabel maps to uppercase Indonesian labels", () => {
  assert.equal(generatedGenderLabel("male"), "LAKI-LAKI");
  assert.equal(generatedGenderLabel("female"), "PEREMPUAN");
});

test("buildKtaRow uses uppercase fields for family metadata", () => {
  const settings: GeneratorSettings = {
    cardType: "KTA",
    dataCount: 1,
    minAge: 1,
    maxAge: 16,
    gender: "FEMALE",
    provinceIds: ["31"],
  };
  const ctx = makeRandomContext(deterministicRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]));
  const row = buildKtaRow(
    REGION,
    new Date(Date.UTC(2015, 4, 10)),
    "female",
    settings,
    ctx.random,
    ctx.faker,
  );
  assert.equal(row.gender, "PEREMPUAN");
  assert.equal(row.headFamilyName, row.headFamilyName.toUpperCase());
  assert.equal(row.nationality, "WNI");
  assert.ok(row.validityPeriod.includes("2032"));
});
