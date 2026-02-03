/**
 * Application Configuration
 * Centralized config for environment-based settings
 */

export const config = {
  // API Configuration
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000,
  },

  // Auth Configuration
  auth: {
    // Show demo credentials on login page (configurable via env)
    showDemoCredentials: process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true',
    // Custom help text for login page
    helpText: process.env.NEXT_PUBLIC_LOGIN_HELP_TEXT || 'Contact your administrator for credentials',
    // Password requirements
    passwordMinLength: 8,
    passwordRequirements: [
      'At least 8 characters',
      'At least one uppercase letter',
      'At least one lowercase letter',
      'At least one number'
    ]
  },

  // Feature Flags
  features: {
    paymentGateway: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED === 'true',
    fileUpload: process.env.NEXT_PUBLIC_FILE_UPLOAD_ENABLED === 'true',
    activityLogging: process.env.NEXT_PUBLIC_ACTIVITY_LOGGING_ENABLED !== 'false',
    dashboardAnalytics: process.env.NEXT_PUBLIC_DASHBOARD_ANALYTICS_ENABLED !== 'false'
  },

  // UI Configuration
  ui: {
    theme: process.env.NEXT_PUBLIC_THEME || 'light',
    itemsPerPage: parseInt(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE || '10'),
    dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'DD/MM/YYYY'
  },

  // Application Info
  app: {
    name: 'School ERP',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
};

/**
 * Get API endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseURL}/api${endpoint}`;
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

export default config;
