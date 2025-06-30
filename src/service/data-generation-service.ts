import type { GeneratorSettingsType } from "@/lib/types";
import type { KTPGeneratedData } from "@/lib/types/ktp-types";
import type { KTAGeneratedData } from "@/lib/types/kta-types";

// Import only backend services (they don't have Node.js dependencies)
import {
  generateBackendKtpData,
  generateBackendKtaData,
  getProvincesFromBackend,
  testBackendConnection,
} from "./backend-data-generator";

/**
 * Generate KTP data using backend API only
 */
export async function generateKtpData(
  settings: GeneratorSettingsType,
): Promise<KTPGeneratedData[]> {
  try {
    console.log("🎯 Generating KTP data using backend API...");

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
    console.log("🎯 Generating KTA data using backend API...");

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
 * Get provinces for selection using backend API with caching
 */
export async function getProvinces(): Promise<{ id: string; name: string }[]> {
  try {
    console.log("🌐 Fetching provinces from backend API...");
    return await getProvincesFromBackend();
  } catch (error) {
    console.error("Error fetching provinces:", error);
    // Return empty array if API fails
    return [];
  }
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
