// Backend API service for random regional data generation and province data
export interface BackendRegionalData {
  province: {
    id: string;
    name: string;
  };
  regency: {
    id: string;
    name: string;
  };
  district: {
    id: string;
    name: string;
  };
  village: {
    id: string;
    name: string;
  };
}

export interface BackendRandomRegionalRequest {
  selectedProvinces?: string[];
  count: number;
  unique?: boolean;
  includeWeighting?: boolean;
}

export interface BackendRandomRegionalResponse {
  success: boolean;
  data: BackendRegionalData[];
  meta: {
    requested: number;
    generated: number;
    unique: number;
    duplicates: number;
    provinces: Record<string, number>;
    processingTime: string;
    algorithm: string;
  };
}

// Province interface for dropdown/selection
export interface Province {
  id: string;
  name: string;
}

export interface BackendProvincesResponse {
  success: boolean;
  data: Province[];
  meta?: {
    total: number;
    processingTime: string;
  };
}

// Configuration for the backend API
const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001/api";

// Simple in-memory cache for provinces
interface ProvinceCache {
  data: Province[] | null;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const provinceCache: ProvinceCache = {
  data: null,
  timestamp: 0,
  ttl: 60 * 60 * 1000, // 1 hour cache
};

/**
 * Fetch provinces from backend API with caching
 */
export async function fetchProvincesFromBackend(): Promise<Province[]> {
  const now = Date.now();

  // Check if we have valid cached data
  if (provinceCache.data && now - provinceCache.timestamp < provinceCache.ttl) {
    console.log("🔄 Using cached province data");
    return provinceCache.data;
  }

  try {
    console.log("🌐 Fetching provinces from backend API...");
    console.log(`📍 API URL: ${BACKEND_API_BASE_URL}/provinces`);

    const response = await fetch(`${BACKEND_API_BASE_URL}/provinces`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`,
    );
    console.log(
      `📊 Response headers:`,
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      // Get response text for better error diagnosis
      const responseText = await response.text();
      console.error(
        `❌ Backend API error response:`,
        responseText.substring(0, 200),
      );

      throw new Error(
        `Backend API error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}...`,
      );
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error(`❌ Invalid content type: ${contentType}`);
      console.error(`❌ Response body:`, responseText.substring(0, 200));

      throw new Error(
        `Backend API returned invalid content type: ${contentType}. Expected JSON but got: ${responseText.substring(0, 100)}...`,
      );
    }

    const data: BackendProvincesResponse = await response.json();

    if (!data.success) {
      throw new Error("Backend API returned unsuccessful response");
    }

    // Update cache
    provinceCache.data = data.data;
    provinceCache.timestamp = now;

    console.log(`✅ Loaded ${data.data.length} provinces from backend API`);
    return data.data;
  } catch (error) {
    console.error("Error fetching provinces from backend:", error);

    // If we have stale cached data, use it as fallback
    if (provinceCache.data) {
      console.log("⚠️ Using stale cached province data as fallback");
      return provinceCache.data;
    }

    throw error;
  }
}

/**
 * Clear province cache (useful for testing or manual refresh)
 */
export function clearProvinceCache(): void {
  provinceCache.data = null;
  provinceCache.timestamp = 0;
  console.log("🗑️ Province cache cleared");
}

/**
 * Fetch random regional data from the backend API
 */
export async function fetchRandomRegionalData(
  request: BackendRandomRegionalRequest,
): Promise<BackendRandomRegionalResponse> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/regions/random`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: BackendRandomRegionalResponse = await response.json();

    if (!data.success) {
      throw new Error("Backend API returned unsuccessful response");
    }

    return data;
  } catch (error) {
    console.error("Error fetching random regional data from backend:", error);
    throw error;
  }
}

/**
 * Generate random regional data for KTP/KTA generation using backend API
 */
export async function generateRandomRegionalDataForCards(
  selectedProvinces: string[],
  count: number,
  unique: boolean = true,
  includeWeighting: boolean = false,
): Promise<BackendRegionalData[]> {
  try {
    const request: BackendRandomRegionalRequest = {
      selectedProvinces:
        selectedProvinces.length > 0 ? selectedProvinces : undefined,
      count,
      unique,
      includeWeighting,
    };

    const response = await fetchRandomRegionalData(request);
    return response.data;
  } catch (error) {
    console.error("Error generating random regional data for cards:", error);
    throw error;
  }
}

/**
 * Test backend API connection
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/regions/random`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count: 1,
        unique: true,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Backend connection test failed:", error);
    return false;
  }
}
