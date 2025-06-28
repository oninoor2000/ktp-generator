import {
  birthPlace,
  bloodType,
  familyName,
  femaleName,
  job,
  maleName,
  maritalStatus,
  provinceData,
  religion,
  streetName,
  subDistrict,
  village,
} from "@/lib/constant/data-generator-constant";
import type { GeneratorSettingsType } from "@/lib/types";
import type { KTPGeneratedData } from "@/lib/types/ktp-types";

/**
 * Get random item from array
 * @param array Array of items
 * @returns Random item from array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pad zero to number
 * @param num Number to pad
 * @param length Length of the number
 * @returns Padded number
 */
function padZero(num: number, length: number): string {
  return num.toString().padStart(length, "0");
}

/**
 * Generate NIK
 * @param birthDate Date of birth
 * @param gender Gender
 * @param province Province
 * @returns NIK
 */
function generateNIK(
  birthDate: Date,
  gender: "MALE" | "FEMALE" | "BOTH",
  province: string,
): string {
  // Find province code
  const prov = provinceData.find((p) => p.name === province) || provinceData[0];

  // Generate district (01-99)
  const district = padZero(Math.floor(Math.random() * 99) + 1, 2);

  // Generate subdistrict (01-99)
  const subdistrict = padZero(Math.floor(Math.random() * 99) + 1, 2);

  // Generate birth date (DDMMYY)
  let day = birthDate.getDate();
  if (gender === "FEMALE") {
    day += 40;
  }
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear() % 100;

  const formattedBirthDate =
    padZero(day, 2) + padZero(month, 2) + padZero(year, 2);

  // Generate serial number (0001-9999)
  const serial = padZero(Math.floor(Math.random() * 9999) + 1, 4);

  return prov.code + district + subdistrict + formattedBirthDate + serial;
}

/**
 * Generate birth date
 * @param minAge Minimum age
 * @param maxAge Maximum age
 * @returns Birth date
 */
function generateBirthDate(minAge: number, maxAge: number): Date {
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - maxAge,
    today.getMonth(),
    today.getDate(),
  );
  const maxDate = new Date(
    today.getFullYear() - minAge,
    today.getMonth(),
    today.getDate(),
  );

  const timeDiff = maxDate.getTime() - minDate.getTime();
  const randomTime = Math.random() * timeDiff;

  return new Date(minDate.getTime() + randomTime);
}

/**
 * Format date
 * @param date Date to format
 * @returns Formatted date
 */
function formatDate(date: Date): string {
  const day = padZero(date.getDate(), 2);
  const month = padZero(date.getMonth() + 1, 2);
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Generate address
 * @returns Address
 */
function generateAddress(): string {
  const street = getRandomItem(streetName);
  const number = Math.floor(Math.random() * 999) + 1;
  return `JL. ${street.replace("JL. ", "")} NO.${number}`;
}

/**
 * Generate RW
 * @returns RW
 */
function generateRW(): string {
  return padZero(Math.floor(Math.random() * 15) + 1, 3);
}

/**
 * Generate RT
 * @returns RT
 */
function generateRT(): string {
  return padZero(Math.floor(Math.random() * 20) + 1, 3);
}

/**
 * Generate address city
 * @param province Province
 * @returns Address city
 */
function generateAddressCity(province: string): string {
  // Find province data
  const prov = provinceData.find((p) => p.name === province);

  if (prov && prov.city && prov.city.length > 0) {
    return getRandomItem(prov.city);
  }

  // Fallback to Jakarta if province not found
  return "JAKARTA PUSAT";
}

/**
 * Convert text to capitalize
 * @param text Text to convert
 * @returns Capitalized text
 */
function toCapitalize(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate KTP data
 * @param settings Generator settings
 * @returns KTP data
 */
export function generateKtpData(
  settings: GeneratorSettingsType,
): KTPGeneratedData[] {
  const data: KTPGeneratedData[] = [];

  for (let i = 0; i < settings.dataCount; i++) {
    const gender =
      settings.gender === "BOTH"
        ? getRandomItem(["MALE", "FEMALE"])
        : settings.gender;

    const birthDate = generateBirthDate(settings.minAge, settings.maxAge);

    const firstName =
      gender === "MALE" ? getRandomItem(maleName) : getRandomItem(femaleName);

    const lastName = getRandomItem(familyName);
    const name = `${firstName} ${lastName}`;

    // Select random province from the selected ones
    const selectedProvince = getRandomItem(settings.province);

    // Generate individual fields first for consistency
    const birthPlaceValue = getRandomItem(birthPlace);
    const birthDateValue = formatDate(birthDate);
    const rtValue = generateRT();
    const rwValue = generateRW();

    const ktpData: KTPGeneratedData = {
      nik: generateNIK(
        birthDate,
        gender as "MALE" | "FEMALE" | "BOTH",
        selectedProvince,
      ),
      name: toCapitalize(name),
      birthPlace: toCapitalize(birthPlaceValue),
      birthDate: birthDateValue,
      birthDatePlace: toCapitalize(`${birthPlaceValue}, ${birthDateValue}`),
      gender: toCapitalize(gender === "MALE" ? "Laki-laki" : "Perempuan"),
      address: toCapitalize(generateAddress()),
      rt: rtValue,
      rw: rwValue,
      rtRw: `${rtValue}/${rwValue}`,
      village: toCapitalize(getRandomItem(village)),
      district: toCapitalize(getRandomItem(subDistrict)),
      city: toCapitalize(generateAddressCity(selectedProvince)),
      province: selectedProvince,
      religion: toCapitalize(getRandomItem(religion)),
      maritalStatus: toCapitalize(getRandomItem(maritalStatus)),
      occupation: toCapitalize(getRandomItem(job)),
      bloodType: getRandomItem(bloodType),
    };

    data.push(ktpData);
  }

  return data;
}
