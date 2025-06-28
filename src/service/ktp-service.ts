import {
  KTP_GENERATOR_SETTINGS_INITIAL_STATE,
  KTP_GENERATOR_SETTINGS_KEY,
  KTP_POSITION_CONFIG_KEY,
} from "@/lib/constant";
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
          dataCount: Number(parsed.dataCount) || 10,
          minAge: Number(parsed.minAge) || 17,
          maxAge: Number(parsed.maxAge) || 65,
          gender: parsed.gender || "BOTH",
          province: Array.isArray(parsed.province)
            ? parsed.province
            : ["DKI JAKARTA"],
        };
      }
    }

    if (KTP_POSITION_CONFIG) {
      const parsed = JSON.parse(KTP_POSITION_CONFIG);
      if (parsed && typeof parsed === "object") {
        data.KTPPositionConfig = parsed;
      }
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
