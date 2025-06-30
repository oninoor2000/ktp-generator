// Database configuration untuk koneksi MySQL wilayah
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

// Default configuration - sesuaikan dengan setup database lokal Anda
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  host: "localhost",
  user: "root",
  password: "", // Kosongkan jika tidak ada password
  database: "region-id", // Nama database yang berisi tabel wilayah
  port: 3306,
};

// Development configuration
export const DEV_DB_CONFIG: DatabaseConfig = {
  ...DEFAULT_DB_CONFIG,
  // Override values for development if needed
};

// Production configuration (jika diperlukan)
export const PROD_DB_CONFIG: DatabaseConfig = {
  ...DEFAULT_DB_CONFIG,
  // Override values for production
  // Contoh:
  // host: 'production-server.com',
  // user: 'prod_user',
  // password: 'secure_password',
};

// Function untuk mendapatkan konfigurasi berdasarkan environment
export function getDatabaseConfig(): DatabaseConfig {
  const env = import.meta.env.MODE || "development";

  switch (env) {
    case "production":
      return PROD_DB_CONFIG;
    case "development":
    default:
      return DEV_DB_CONFIG;
  }
}

// Helper untuk membuat connection string dari config
export function createConnectionString(config: DatabaseConfig): string {
  return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

// Validasi konfigurasi database
export function validateDatabaseConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === "") {
    errors.push("Database host is required");
  }

  if (!config.user || config.user.trim() === "") {
    errors.push("Database user is required");
  }

  if (!config.database || config.database.trim() === "") {
    errors.push("Database name is required");
  }

  if (!config.port || config.port <= 0 || config.port > 65535) {
    errors.push("Database port must be between 1 and 65535");
  }

  return errors;
}

// Environment variables yang dapat digunakan untuk override konfigurasi
export function getConfigFromEnv(): Partial<DatabaseConfig> {
  return {
    host: import.meta.env.VITE_DB_HOST || undefined,
    user: import.meta.env.VITE_DB_USER || undefined,
    password: import.meta.env.VITE_DB_PASSWORD || undefined,
    database: import.meta.env.VITE_DB_NAME || undefined,
    port: import.meta.env.VITE_DB_PORT
      ? parseInt(import.meta.env.VITE_DB_PORT)
      : undefined,
  };
}

// Merge konfigurasi default dengan environment variables
export function getFinalDatabaseConfig(): DatabaseConfig {
  const defaultConfig = getDatabaseConfig();
  const envConfig = getConfigFromEnv();

  // Merge configs, environment variables take precedence
  const finalConfig: DatabaseConfig = {
    ...defaultConfig,
    ...(Object.fromEntries(
      Object.entries(envConfig).filter(([, value]) => value !== undefined),
    ) as Partial<DatabaseConfig>),
  };

  // Validate final configuration
  const errors = validateDatabaseConfig(finalConfig);
  if (errors.length > 0) {
    console.warn("Database configuration warnings:", errors);
  }

  return finalConfig;
}
