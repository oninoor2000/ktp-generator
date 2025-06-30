import {
  KTP_GENERATOR_SETTINGS_INITIAL_STATE,
  KTP_GENERATOR_SETTINGS_KEY,
  KTP_POSITION_CONFIG_KEY,
} from "@/lib/constant";
import { DEFAULT_KTP_POSITION_CONFIG } from "@/lib/constant/ktp-position-constant";
import type { GeneratorSettingsType } from "@/lib/types";
import type { KTPPositionConfig } from "@/lib/types/ktp-types";

/**
 * Load ktp generator settings from local storage and position config
 * @returns @type {GeneratorSettingsType}
 */
export function loadKtpGeneratorSettings(): GeneratorSettingsType {
  try {
    let data = KTP_GENERATOR_SETTINGS_INITIAL_STATE;
    const KTP_GENERATOR_SETTINGS = localStorage.getItem(
      KTP_GENERATOR_SETTINGS_KEY,
    );
    const KTP_POSITION_CONFIG = localStorage.getItem(KTP_POSITION_CONFIG_KEY);

    if (KTP_GENERATOR_SETTINGS) {
      const parsed = JSON.parse(KTP_GENERATOR_SETTINGS);
      if (parsed && typeof parsed === "object") {
        data = {
          ...data,
          dataCount: Number(parsed.dataCount) || 10,
          minAge: Number(parsed.minAge) || 17,
          maxAge: Number(parsed.maxAge) || 65,
          gender: parsed.gender || "BOTH",
          province: Array.isArray(parsed.province)
            ? parsed.province
            : ["Daerah Khusus Ibukota Jakarta"],
        };
      }
    }

    if (KTP_POSITION_CONFIG) {
      const parsed = JSON.parse(KTP_POSITION_CONFIG);
      if (parsed && typeof parsed === "object") {
        // Check each property individually and assign default if missing
        const updatedConfig: KTPPositionConfig = {
          province: parsed.province || DEFAULT_KTP_POSITION_CONFIG.province,
          city: parsed.city || DEFAULT_KTP_POSITION_CONFIG.city,
          nik: parsed.nik || DEFAULT_KTP_POSITION_CONFIG.nik,
          name: parsed.name || DEFAULT_KTP_POSITION_CONFIG.name,
          birthDatePlace:
            parsed.birthDatePlace || DEFAULT_KTP_POSITION_CONFIG.birthDatePlace,
          gender: parsed.gender || DEFAULT_KTP_POSITION_CONFIG.gender,
          address: parsed.address || DEFAULT_KTP_POSITION_CONFIG.address,
          rtRw: parsed.rtRw || DEFAULT_KTP_POSITION_CONFIG.rtRw,
          village: parsed.village || DEFAULT_KTP_POSITION_CONFIG.village,
          district: parsed.district || DEFAULT_KTP_POSITION_CONFIG.district,
          religion: parsed.religion || DEFAULT_KTP_POSITION_CONFIG.religion,
          maritalStatus:
            parsed.maritalStatus || DEFAULT_KTP_POSITION_CONFIG.maritalStatus,
          occupation:
            parsed.occupation || DEFAULT_KTP_POSITION_CONFIG.occupation,
          bloodType: parsed.bloodType || DEFAULT_KTP_POSITION_CONFIG.bloodType,
          nationality:
            parsed.nationality || DEFAULT_KTP_POSITION_CONFIG.nationality,
          validUntil:
            parsed.validUntil || DEFAULT_KTP_POSITION_CONFIG.validUntil,
        };

        data.KTPPositionConfig = updatedConfig;
        // Save the updated config back to localStorage
        saveKtpPositionConfig(updatedConfig);
      }
    } else {
      // If no KTP position config exists, save the default config
      data.KTPPositionConfig = DEFAULT_KTP_POSITION_CONFIG;
      saveKtpPositionConfig(DEFAULT_KTP_POSITION_CONFIG);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to load generator settings from localStorage:",
      error,
    );
  }
  return KTP_GENERATOR_SETTINGS_INITIAL_STATE;
}

/**
 * Save ktp generator settings to local storage
 * @param data @type {GeneratorSettingsType}
 */
export function saveKtpGeneratorSettings(
  data: Omit<GeneratorSettingsType, "KTPData" | "KTPPositionConfig">,
) {
  try {
    localStorage.setItem(KTP_GENERATOR_SETTINGS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save generator settings to localStorage:", error);
  }
}

/**
 * Save ktp position config to local storage
 * @param data @type {KTPPositionConfig}
 */
export function saveKtpPositionConfig(data: KTPPositionConfig) {
  try {
    localStorage.setItem(KTP_POSITION_CONFIG_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save position settings to localStorage:", error);
  }
}
