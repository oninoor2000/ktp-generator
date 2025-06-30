import type { GeneratorSettingsType } from "@/lib/types";
import type { KTPGeneratedData } from "@/lib/types/ktp-types";
import type { KTAGeneratedData } from "@/lib/types/kta-types";

// Import only backend services (they don't have Node.js dependencies)
import {
  generateBackendKtpData,
  generateBackendKtaData,
  testBackendConnection,
} from "./backend-data-generator";
import { PROVINCES_DATA } from "@/lib/constant/data-generator-constant";

/**
 * Generate KTP data using backend API only
 */
export async function generateKtpData(
  settings: GeneratorSettingsType,
): Promise<KTPGeneratedData[]> {
  try {
    // Test backend connection first
    const isBackendAvailable = await testBackendConnection();
    if (!isBackendAvailable) {
      throw new Error(
        "Backend API is not available. Please ensure your backend server is running at the configured URL.",
      );
    }

    return await generateBackendKtpData(settings);
  } catch (error) {
    console.error("Error generating KTP data:", error);
    throw error;
  }
}

/**
 * Generate KTA data using backend API only
 */
export async function generateKtaData(
  settings: GeneratorSettingsType,
): Promise<KTAGeneratedData[]> {
  try {
    // Test backend connection first
    const isBackendAvailable = await testBackendConnection();
    if (!isBackendAvailable) {
      throw new Error(
        "Backend API is not available. Please ensure your backend server is running at the configured URL.",
      );
    }

    return await generateBackendKtaData(settings);
  } catch (error) {
    console.error("Error generating KTA data:", error);
    throw error;
  }
}

/**
 * Get provinces for selection using static data
 */
export async function getProvinces(): Promise<{ id: string; name: string }[]> {
  // Return static province data
  return PROVINCES_DATA.map((province) => ({
    id: province.id,
    name: province.name,
  }));
}

/**
 * Check if backend API is available
 */
export async function checkBackendStatus(): Promise<boolean> {
  try {
    return await testBackendConnection();
  } catch (error) {
    console.error("Backend status check failed:", error);
    return false;
  }
}
