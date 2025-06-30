import {
  KTA_GENERATOR_SETTINGS_INITIAL_STATE,
  KTA_GENERATOR_SETTINGS_KEY,
  KTA_POSITION_CONFIG_KEY,
} from "@/lib/constant";
import { DEFAULT_KTA_POSITION_CONFIG } from "@/lib/constant/kta-postition-constant";
import type { GeneratorSettingsType } from "@/lib/types";
import type { KTAPositionConfig } from "@/lib/types/kta-types";

/**
 * Load KTA generator settings from local storage and position config
 * @returns @type {GeneratorSettingsType}
 */
export function loadKtaGeneratorSettings(): GeneratorSettingsType {
  try {
    let data = KTA_GENERATOR_SETTINGS_INITIAL_STATE;
    const KTA_GENERATOR_SETTINGS = localStorage.getItem(
      KTA_GENERATOR_SETTINGS_KEY,
    );
    const KTA_POSITION_CONFIG = localStorage.getItem(KTA_POSITION_CONFIG_KEY);

    if (KTA_GENERATOR_SETTINGS) {
      const parsed = JSON.parse(KTA_GENERATOR_SETTINGS);
      if (parsed && typeof parsed === "object") {
        data = {
          ...data,
          dataCount: Number(parsed.dataCount) || 10,
          minAge: Number(parsed.minAge) || 1,
          maxAge: Number(parsed.maxAge) || 16,
          gender: parsed.gender || "BOTH",
          province: Array.isArray(parsed.province)
            ? parsed.province
            : ["DKI JAKARTA"],
        };
      }
    }

    if (KTA_POSITION_CONFIG) {
      const parsed = JSON.parse(KTA_POSITION_CONFIG);
      if (parsed && typeof parsed === "object") {
        // Check each property individually and assign default if missing
        const updatedConfig: KTAPositionConfig = {
          province: parsed.province || DEFAULT_KTA_POSITION_CONFIG.province,
          city: parsed.city || DEFAULT_KTA_POSITION_CONFIG.city,
          nik: parsed.nik || DEFAULT_KTA_POSITION_CONFIG.nik,
          name: parsed.name || DEFAULT_KTA_POSITION_CONFIG.name,
          birthDatePlace:
            parsed.birthDatePlace || DEFAULT_KTA_POSITION_CONFIG.birthDatePlace,
          gender: parsed.gender || DEFAULT_KTA_POSITION_CONFIG.gender,
          address: parsed.address || DEFAULT_KTA_POSITION_CONFIG.address,
          rtRw: parsed.rtRw || DEFAULT_KTA_POSITION_CONFIG.rtRw,
          village: parsed.village || DEFAULT_KTA_POSITION_CONFIG.village,
          district: parsed.district || DEFAULT_KTA_POSITION_CONFIG.district,
          religion: parsed.religion || DEFAULT_KTA_POSITION_CONFIG.religion,
          bloodType: parsed.bloodType || DEFAULT_KTA_POSITION_CONFIG.bloodType,
          nationality:
            parsed.nationality || DEFAULT_KTA_POSITION_CONFIG.nationality,
          validityPeriod:
            parsed.validityPeriod || DEFAULT_KTA_POSITION_CONFIG.validityPeriod,
          familyCertificateNumber:
            parsed.familyCertificateNumber ||
            DEFAULT_KTA_POSITION_CONFIG.familyCertificateNumber,
          headFamilyName:
            parsed.headFamilyName || DEFAULT_KTA_POSITION_CONFIG.headFamilyName,
          birthCertificateNumber:
            parsed.birthCertificateNumber ||
            DEFAULT_KTA_POSITION_CONFIG.birthCertificateNumber,
        };

        data.KTAPositionConfig = updatedConfig;
        // Save the updated config back to localStorage
        saveKtaPositionConfig(updatedConfig);
      }
    } else {
      // If no KTA position config exists, save the default config
      data.KTAPositionConfig = DEFAULT_KTA_POSITION_CONFIG;
      saveKtaPositionConfig(DEFAULT_KTA_POSITION_CONFIG);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to load KTA generator settings from localStorage:",
      error,
    );
  }
  return KTA_GENERATOR_SETTINGS_INITIAL_STATE;
}

/**
 * Save KTA generator settings to local storage
 * @param data @type {GeneratorSettingsType}
 */
export function saveKtaGeneratorSettings(
  data: Omit<GeneratorSettingsType, "KTAData" | "KTAPositionConfig">,
) {
  try {
    localStorage.setItem(KTA_GENERATOR_SETTINGS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(
      "Failed to save KTA generator settings to localStorage:",
      error,
    );
  }
}

/**
 * Save KTA position config to local storage
 * @param data @type {KTAPositionConfig}
 */
export function saveKtaPositionConfig(data: KTAPositionConfig) {
  try {
    localStorage.setItem(KTA_POSITION_CONFIG_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(
      "Failed to save KTA position settings to localStorage:",
      error,
    );
  }
}
