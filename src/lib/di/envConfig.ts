/**
 * Environment Configuration
 *
 * Provides type-safe environment configuration for the DI container.
 * Centralizes all environment variable access and provides defaults.
 */

/**
 * Environment configuration interface.
 * Defines the structure of application environment settings.
 */
export interface EnvConfig {
  database: {
    uri: string;
    name: string;
  };
  storage: {
    type: 'local' | 'cloudinary' | 's3';
    localPath?: string;
    cloudinary?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
    s3?: {
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    from: string;
  };
  app: {
    url: string;
    name: string;
  };
}

/**
 * Load and validate environment configuration.
 * Throws an error if required environment variables are missing.
 */
export function loadEnvConfig(): EnvConfig {
  // Validate required environment variables
  const requiredVars: Record<string, string | undefined> = {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    database: {
      uri: process.env.MONGODB_URI!,
      name: process.env.MONGODB_NAME || 'family-tree',
    },
    storage: {
      type: (process.env.STORAGE_TYPE as 'local' | 'cloudinary' | 's3') || 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
      ...(process.env.CLOUDINARY_CLOUD_NAME && {
        cloudinary: {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY!,
          apiSecret: process.env.CLOUDINARY_API_SECRET!,
        },
      }),
      ...(process.env.S3_BUCKET && {
        s3: {
          region: process.env.S3_REGION!,
          bucket: process.env.S3_BUCKET,
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      }),
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses') || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@familytree.app',
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL!,
      name: process.env.NEXT_PUBLIC_APP_NAME || 'Family Tree',
    },
  };
}

/**
 * Validate that the current environment has all required variables.
 * Returns true if valid, throws if invalid.
 */
export function validateEnvConfig(): boolean {
  try {
    loadEnvConfig();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Environment validation failed:', error.message);
    }
    throw error;
  }
}

/**
 * Check if the application is running in development mode.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the application is running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if the application is running in test mode.
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get the current environment mode.
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
}
