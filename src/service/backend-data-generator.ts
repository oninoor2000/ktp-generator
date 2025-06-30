import { faker } from "@faker-js/faker/locale/id_ID";
import {
  bloodType,
  maritalStatus,
  religion,
  job,
} from "../lib/constant/data-generator-constant";
import type { GeneratorSettingsType } from "../lib/types";
import type { KTPGeneratedData } from "../lib/types/ktp-types";
import type { KTAGeneratedData } from "../lib/types/kta-types";
import {
  generateRandomRegionalDataForCards,
  testBackendConnection,
  type BackendRegionalData,
  type Province,
} from "./backend-regional-api";

/**
 * Get provinces from backend API
 */
export async function getProvincesFromBackend(): Promise<Province[]> {
  try {
    console.log("🌍 Getting provinces from backend API...");

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/provinces`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error("Invalid response format");
    }

    console.log(
      `✅ Retrieved ${result.data.length} provinces from backend API`,
    );
    return result.data;
  } catch (error) {
    console.error("Error fetching provinces from backend:", error);
    throw new Error("Failed to fetch provinces from backend API");
  }
}

/**
 * Test if backend API is available
 */
export { testBackendConnection };

/**
 * Generate NIK (Nomor Induk Kependudukan) without dots
 */
function generateNIK(
  provinceCode: string,
  regencyCode: string,
  districtCode: string,
  birthDate: Date,
  gender: "male" | "female",
): string {
  // Format: PPKKDD + DDMMYY + XXXX
  const pp = provinceCode.padStart(2, "0");
  const kk = regencyCode.slice(-2).padStart(2, "0");
  const dd = districtCode.slice(-2).padStart(2, "0");

  // Birth date with gender consideration (female +40 to day)
  const day = birthDate.getDate();
  const dayWithGender = gender === "female" ? day + 40 : day;
  const formattedDay = dayWithGender.toString().padStart(2, "0");

  const month = (birthDate.getMonth() + 1).toString().padStart(2, "0");
  const year = birthDate.getFullYear().toString().slice(-2);

  // Random 4-digit sequence
  const sequence = faker.string.numeric(4);

  // Return NIK without any dots
  return `${pp}${kk}${dd}${formattedDay}${month}${year}${sequence}`;
}

/**
 * Generate Indonesian name based on gender
 */
function generateIndonesianName(gender: "male" | "female"): string {
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  return `${firstName} ${lastName}`;
}

/**
 * Generate birth place
 */
function generateBirthPlace(regionData: BackendRegionalData): string {
  let birthPlace = regionData.regency.name;

  // Remove "Kabupaten" or "Kota" prefix for cleaner birth place format
  if (birthPlace.startsWith("Kabupaten ")) {
    birthPlace = birthPlace.replace("Kabupaten ", "");
  } else if (birthPlace.startsWith("Kota ")) {
    birthPlace = birthPlace.replace("Kota ", "");
  }

  return birthPlace;
}

/**
 * Capitalize function for proper formatting
 */
function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format date as dd-mm-yyyy
 */
function formatDateDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Generate address from regional data
 */
function generateFullAddress(regionData: BackendRegionalData): {
  address: string;
  rtRw: string;
  city: string;
} {
  const streetName = faker.location.streetAddress();
  const rtRw = `${faker.string
    .numeric({ length: 3, allowLeadingZeros: false })
    .padStart(3, "0")
    .slice(0, 3)}/${faker.string
    .numeric({ length: 3, allowLeadingZeros: false })
    .padStart(3, "0")
    .slice(0, 3)}`;

  return {
    address: streetName,
    rtRw,
    city: regionData.regency.name,
  };
}

/**
 * Generate KTP data using backend API
 */
export async function generateBackendKtpData(
  settings: GeneratorSettingsType,
): Promise<KTPGeneratedData[]> {
  try {
    console.log("🎯 Generating KTP data using backend API...");

    // Get regional data from backend
    const regionalData = await generateRandomRegionalDataForCards(
      settings.province, // Use 'province' field from GeneratorSettingsType
      settings.dataCount, // Use 'dataCount' field from GeneratorSettingsType
      true, // unique
      false, // includeWeighting
    );

    const ktpData: KTPGeneratedData[] = [];

    for (const regionData of regionalData) {
      // Generate basic data
      const gender = faker.person.sexType() as "male" | "female";
      const birthDate = faker.date.birthdate({ min: 17, max: 80, mode: "age" });
      const fullName = generateIndonesianName(gender);
      const birthPlace = generateBirthPlace(regionData);
      const addressData = generateFullAddress(regionData);

      // Generate NIK without dots
      const nik = generateNIK(
        regionData.province.id,
        regionData.regency.id,
        regionData.district.id,
        birthDate,
        gender,
      );

      // Create KTP data with capitalized fields
      const ktp: KTPGeneratedData = {
        nik,
        name: fullName,
        birthPlace,
        birthDate: formatDateDDMMYYYY(birthDate),
        birthDatePlace: `${birthPlace}, ${formatDateDDMMYYYY(birthDate)}`,
        gender: gender === "male" ? "Laki-laki" : "Perempuan",
        bloodType: faker.helpers.arrayElement(bloodType),
        address: addressData.address,
        rt: addressData.rtRw.split("/")[0],
        rw: addressData.rtRw.split("/")[1],
        rtRw: addressData.rtRw,
        village: regionData.village.name,
        city: addressData.city,
        district: regionData.district.name,
        province: regionData.province.name,
        religion: capitalizeWords(faker.helpers.arrayElement(religion)),
        maritalStatus: capitalizeWords(
          faker.helpers.arrayElement(maritalStatus),
        ),
        occupation: capitalizeWords(faker.helpers.arrayElement(job)),
        nationality: "WNI",
        validityPeriod: "SEUMUR HIDUP",
      };

      ktpData.push(ktp);
    }

    console.log(`✅ Generated ${ktpData.length} KTP records using backend API`);
    return ktpData;
  } catch (error) {
    console.error("Error generating KTP data from backend:", error);
    throw new Error("Failed to generate KTP data from backend API");
  }
}

/**
 * Generate KTA data using backend API
 */
export async function generateBackendKtaData(
  settings: GeneratorSettingsType,
): Promise<KTAGeneratedData[]> {
  try {
    console.log("🎯 Generating KTA data using backend API...");

    // Get regional data from backend
    const regionalData = await generateRandomRegionalDataForCards(
      settings.province, // Use 'province' field from GeneratorSettingsType
      settings.dataCount, // Use 'dataCount' field from GeneratorSettingsType
      true, // unique
      false, // includeWeighting
    );

    const ktaData: KTAGeneratedData[] = [];

    for (const regionData of regionalData) {
      // Generate basic data
      const gender = faker.person.sexType() as "male" | "female";
      const birthDate = faker.date.birthdate({ min: 17, max: 80, mode: "age" });
      const fullName = generateIndonesianName(gender);
      const birthPlace = generateBirthPlace(regionData);
      const addressData = generateFullAddress(regionData);

      // Generate NIK without dots
      const nik = generateNIK(
        regionData.province.id,
        regionData.regency.id,
        regionData.district.id,
        birthDate,
        gender,
      );

      // Generate KK and Akta numbers
      const generateKKNumber = (): string => {
        return (
          regionData.province.id +
          regionData.regency.id.slice(-2) +
          faker.string.numeric(12)
        );
      };

      const generateAktaNumber = (): string => {
        const year = new Date().getFullYear();
        return `${regionData.regency.id}-LK-${year}-${faker.string.numeric(8)}`;
      };

      // Create KTA data with capitalized fields
      const kta: KTAGeneratedData = {
        nik,
        name: fullName,
        birthPlace,
        birthDate: formatDateDDMMYYYY(birthDate),
        birthDatePlace: `${birthPlace}, ${formatDateDDMMYYYY(birthDate)}`,
        gender: gender === "male" ? "Laki-laki" : "Perempuan",
        bloodType: faker.helpers.arrayElement(bloodType),
        address: addressData.address,
        rt: addressData.rtRw.split("/")[0],
        rw: addressData.rtRw.split("/")[1],
        rtRw: addressData.rtRw,
        village: regionData.village.name,
        city: addressData.city,
        district: regionData.district.name,
        province: regionData.province.name,
        religion: capitalizeWords(faker.helpers.arrayElement(religion)),
        nationality: "WNI",
        validityPeriod: "BERLAKU HINGGA ANAK BERUSIA 17 TAHUN",
        familyCertificateNumber: generateKKNumber(),
        headFamilyName: generateIndonesianName("male"),
        birthCertificateNumber: generateAktaNumber(),
      };

      ktaData.push(kta);
    }

    console.log(`✅ Generated ${ktaData.length} KTA records using backend API`);
    return ktaData;
  } catch (error) {
    console.error("Error generating KTA data from backend:", error);
    throw new Error("Failed to generate KTA data from backend API");
  }
}
