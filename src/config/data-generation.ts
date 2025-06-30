/**
 * Data generation configuration for backend API only
 */
export interface DataGenerationConfig {
  backendApiUrl: string;
}

/**
 * Default configuration
 */
export const DEFAULT_DATA_GENERATION_CONFIG: DataGenerationConfig = {
  backendApiUrl: "http://localhost:3001/api",
};

/**
 * Get configuration from environment variables
 */
export function getDataGenerationConfigFromEnv(): Partial<DataGenerationConfig> {
  return {
    backendApiUrl: import.meta.env.VITE_BACKEND_API_URL || undefined,
  };
}

/**
 * Get final configuration by merging defaults with environment variables
 */
export function getFinalDataGenerationConfig(): DataGenerationConfig {
  const defaultConfig = DEFAULT_DATA_GENERATION_CONFIG;
  const envConfig = getDataGenerationConfigFromEnv();

  return {
    ...defaultConfig,
    ...(Object.fromEntries(
      Object.entries(envConfig).filter(([, value]) => value !== undefined),
    ) as Partial<DataGenerationConfig>),
  };
}
