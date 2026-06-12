import { fakerID_ID } from "@faker-js/faker";
import { BLOOD_TYPE, JOB, MARITAL_STATUS, RELIGION } from "./constants";
import {
  formatBirthDatePlace,
  formatDateDDMMYYYY,
  getBirthPlace,
  joinRtRw,
  pad2,
  uppercaseOfficial,
} from "./format";
import type {
  GeneratedGender,
  GenderInput,
  GeneratedRow,
  GeneratorSettings,
  KTAGeneratedData,
  KTPGeneratedData,
  RegionalData,
} from "./types";

const faker = fakerID_ID;

export type RandomProvider = () => number;

const defaultRandom: RandomProvider = () => Math.random();

export interface RandomContext {
  random: RandomProvider;
  faker: typeof faker;
}

export function makeRandomContext(
  random: RandomProvider = defaultRandom,
): RandomContext {
  return { random, faker };
}

export function chooseGender(
  input: GenderInput,
  random: RandomProvider = defaultRandom,
): "male" | "female" {
  if (input === "MALE") return "male";
  if (input === "FEMALE") return "female";
  return random() < 0.5 ? "male" : "female";
}

export function generatedGenderLabel(
  gender: "male" | "female",
): GeneratedGender {
  return gender === "male" ? "LAKI-LAKI" : "PEREMPUAN";
}

export function pickProvinceCode(id: string): string {
  return id.slice(0, 2).padStart(2, "0");
}

export function pickRegencyCode(id: string): string {
  return id.slice(-2).padStart(2, "0");
}

export function pickDistrictCode(id: string): string {
  return id.slice(-2).padStart(2, "0");
}

export function randomSequence(random: RandomProvider): string {
  // 4-digit sequence, leading zeros allowed.
  const value = Math.floor(random() * 10000);
  return pad2(Math.floor(value / 100)) + pad2(value % 100);
}

export function generateNik(args: {
  provinceId: string;
  regencyId: string;
  districtId: string;
  birthDate: Date;
  gender: "male" | "female";
  sequence: string;
}): string {
  const { provinceId, regencyId, districtId, birthDate, gender, sequence } =
    args;
  const pp = pickProvinceCode(provinceId);
  const kk = pickRegencyCode(regencyId);
  const dd = pickDistrictCode(districtId);
  const baseDay = birthDate.getUTCDate();
  const day = gender === "female" ? baseDay + 40 : baseDay;
  const dayWithGender = pad2(day);
  const month = pad2(birthDate.getUTCMonth() + 1);
  const year = String(birthDate.getUTCFullYear()).slice(-2);
  return `${pp}${kk}${dd}${dayWithGender}${month}${year}${sequence}`;
}

export function ageDateRange(
  minAge: number,
  maxAge: number,
  now: Date = new Date(),
  random: RandomProvider = defaultRandom,
): { start: Date; end: Date } {
  const minBirth = new Date(
    Date.UTC(now.getUTCFullYear() - maxAge, 0, 1, 0, 0, 0, 0),
  );
  const maxBirth = new Date(
    Date.UTC(now.getUTCFullYear() - minAge, 11, 31, 23, 59, 59, 999),
  );
  const span = maxBirth.getTime() - minBirth.getTime();
  const offset = Math.floor(random() * span);
  const birth = new Date(minBirth.getTime() + offset);
  return { start: minBirth, end: birth };
}

export function randomBirthDate(
  minAge: number,
  maxAge: number,
  now: Date = new Date(),
  random: RandomProvider = defaultRandom,
): Date {
  return ageDateRange(minAge, maxAge, now, random).end;
}

export function buildAddress(
  random: RandomProvider = defaultRandom,
): string {
  const street = faker.location.street();
  const number = Math.floor(random() * 200) + 1;
  return uppercaseOfficial(`JL. ${street} NO. ${number}`);
}

export function buildKtpRow(
  region: RegionalData,
  birthDate: Date,
  gender: "male" | "female",
  _settings: GeneratorSettings,
  random: RandomProvider = defaultRandom,
  fakerImpl: typeof faker = faker,
): KTPGeneratedData {
  const city = region.regency.name;
  const nik = generateNik({
    provinceId: region.province.id,
    regencyId: region.regency.id,
    districtId: region.district.id,
    birthDate,
    gender,
    sequence: randomSequence(random),
  });
  const rt = String((Math.floor(random() * 20) || 1)).padStart(2, "0");
  const rw = String((Math.floor(random() * 10) || 1)).padStart(2, "0");
  const name = uppercaseOfficial(fakerImpl.person.fullName().replace(/\./g, " "));
  const birthPlace = getBirthPlace(city);
  const religion = RELIGION[Math.floor(random() * RELIGION.length)];
  const maritalStatus =
    MARITAL_STATUS[Math.floor(random() * MARITAL_STATUS.length)];
  const occupation = JOB[Math.floor(random() * JOB.length)];
  const bloodType = BLOOD_TYPE[Math.floor(random() * BLOOD_TYPE.length)];
  return {
    nik,
    name,
    birthPlace,
    birthDate: formatDateDDMMYYYY(birthDate),
    birthDatePlace: formatBirthDatePlace(city, birthDate),
    gender: generatedGenderLabel(gender),
    address: buildAddress(random),
    rt,
    rw,
    rtRw: joinRtRw(rt, rw),
    village: uppercaseOfficial(region.village.name),
    district: uppercaseOfficial(region.district.name),
    city: uppercaseOfficial(city),
    province: uppercaseOfficial(region.province.name),
    religion,
    maritalStatus,
    occupation,
    bloodType,
    nationality: "WNI",
    validityPeriod: "SEUMUR HIDUP",
  };
}

export function buildKtaRow(
  region: RegionalData,
  birthDate: Date,
  gender: "male" | "female",
  settings: GeneratorSettings,
  random: RandomProvider = defaultRandom,
  fakerImpl: typeof faker = faker,
): KTAGeneratedData {
  const base = buildKtpRow(region, birthDate, gender, settings, random, fakerImpl);
  const expiresOn = new Date(
    Date.UTC(birthDate.getUTCFullYear() + 17, birthDate.getUTCMonth(), birthDate.getUTCDate()),
  );
  const familyCertificateNumber = Array.from(
    { length: 16 },
    () => Math.floor(random() * 10),
  ).join("");
  const birthCertificateNumber = Array.from(
    { length: 12 },
    () => Math.floor(random() * 10),
  ).join("");
  return {
    ...base,
    validityPeriod: formatDateDDMMYYYY(expiresOn),
    familyCertificateNumber,
    headFamilyName: uppercaseOfficial(
      fakerImpl.person.fullName().replace(/\./g, " "),
    ),
    birthCertificateNumber,
  };
}

export function generateKtpRows(
  settings: GeneratorSettings,
  regions: RegionalData[],
  ctx: RandomContext = makeRandomContext(),
): KTPGeneratedData[] {
  if (regions.length === 0) return [];
  const rows: KTPGeneratedData[] = [];
  for (let i = 0; i < settings.dataCount; i += 1) {
    const region = regions[i % regions.length];
    const birth = randomBirthDate(
      settings.minAge,
      settings.maxAge,
      new Date(),
      ctx.random,
    );
    const gender = chooseGender(settings.gender, ctx.random);
    rows.push(buildKtpRow(region, birth, gender, settings, ctx.random, ctx.faker));
  }
  return rows;
}

export function generateKtaRows(
  settings: GeneratorSettings,
  regions: RegionalData[],
  ctx: RandomContext = makeRandomContext(),
): KTAGeneratedData[] {
  if (regions.length === 0) return [];
  const rows: KTAGeneratedData[] = [];
  for (let i = 0; i < settings.dataCount; i += 1) {
    const region = regions[i % regions.length];
    const birth = randomBirthDate(
      settings.minAge,
      settings.maxAge,
      new Date(),
      ctx.random,
    );
    const gender = chooseGender(settings.gender, ctx.random);
    rows.push(buildKtaRow(region, birth, gender, settings, ctx.random, ctx.faker));
  }
  return rows;
}

export function generateRows(
  settings: GeneratorSettings,
  regions: RegionalData[],
  ctx: RandomContext = makeRandomContext(),
): GeneratedRow[] {
  return settings.cardType === "KTP"
    ? generateKtpRows(settings, regions, ctx)
    : generateKtaRows(settings, regions, ctx);
}
