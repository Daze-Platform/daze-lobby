/**
 * Environment detection utilities
 */

export const isProduction = (): boolean => {
  const hostname = window.location.hostname;
  
  // Production: Published Lovable apps (*.lovable.app without preview pattern)
  if (hostname.endsWith('.lovable.app') && !hostname.includes('-preview--')) {
    return true;
  }
  
  // Everything else is considered non-production (localhost, preview URLs, etc.)
  return false;
};

export const isTestEnvironment = (): boolean => {
  return !isProduction();
};
