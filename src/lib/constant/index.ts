import type { GeneratorSettingsType } from "@/lib/types";
import { DEFAULT_KTP_POSITION_CONFIG } from "./ktp-position-constant";
import { DEFAULT_KTA_POSITION_CONFIG } from "./kta-postition-constant";

/**
 * localStorage keys
 */
export const KTP_POSITION_CONFIG_KEY = "ktp-generator-position-config";
export const KTA_POSITION_CONFIG_KEY = "kta-generator-position-config";
export const KTP_GENERATOR_SETTINGS_KEY = "ktp-generator-settings";
export const KTA_GENERATOR_SETTINGS_KEY = "kta-generator-settings";

/**
 * NAVIGATION_LINKS is the array of links that are used in the navigation menu.
 */
export const NAVIGATION_LINKS = [
  { href: "/", label: "KTP Generator" },
  { href: "/kta", label: "KTA Generator" },
];

export const KTP_GENERATOR_SETTINGS_INITIAL_STATE: GeneratorSettingsType = {
  dataCount: 10,
  minAge: 18,
  maxAge: 60,
  gender: "BOTH",
  province: ["DKI Jakarta"],
  KTPData: [],
  KTPPositionConfig: DEFAULT_KTP_POSITION_CONFIG,
};

export const KTA_GENERATOR_SETTINGS_INITIAL_STATE: GeneratorSettingsType = {
  dataCount: 10,
  minAge: 18,
  maxAge: 60,
  gender: "BOTH",
  province: ["DKI Jakarta"],
  KTAData: [],
  KTAPositionConfig: DEFAULT_KTA_POSITION_CONFIG,
};
