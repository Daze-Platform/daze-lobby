/**
 * CSS Sanitization Utilities
 * 
 * Prevents CSS injection attacks by validating and sanitizing
 * user-provided CSS values before they are used in style elements.
 */

// Valid CSS color patterns
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const RGB_REGEX = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
const RGBA_REGEX = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;
const HSL_REGEX = /^hsl\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/;
const HSLA_REGEX = /^hsla\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/;
const CSS_VAR_REGEX = /^var\(--[a-zA-Z0-9-]+\)$/;

// Named colors (subset of CSS named colors for safety)
const NAMED_COLORS = new Set([
  'transparent', 'currentcolor', 'inherit',
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 
  'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'olive', 'maroon', 'aqua', 'silver', 'fuchsia'
]);

/**
 * Validates if a string is a safe CSS color value.
 * Returns true only for valid color formats.
 */
export function isValidCssColor(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const trimmed = value.trim().toLowerCase();
  
  // Check named colors
  if (NAMED_COLORS.has(trimmed)) {
    return true;
  }
  
  // Check various color formats
  if (HEX_COLOR_REGEX.test(value.trim())) return true;
  if (RGB_REGEX.test(value.trim())) return true;
  if (RGBA_REGEX.test(value.trim())) return true;
  if (HSL_REGEX.test(value.trim())) return true;
  if (HSLA_REGEX.test(value.trim())) return true;
  if (CSS_VAR_REGEX.test(value.trim())) return true;
  
  return false;
}

/**
 * Sanitizes a CSS color value. Returns the color if valid,
 * otherwise returns a safe fallback.
 */
export function sanitizeCssColor(value: string | undefined | null, fallback = 'transparent'): string {
  if (isValidCssColor(value)) {
    return value!.trim();
  }
  return fallback;
}

/**
 * Validates if a string is a safe CSS property key.
 * Only allows alphanumeric characters and hyphens.
 */
export function isValidCssPropertyKey(key: string | undefined | null): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  // Only allow alphanumeric, hyphens, underscores - no special characters
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key);
}

/**
 * Sanitizes a CSS property key. Returns the key if valid,
 * otherwise returns a sanitized version or fallback.
 */
export function sanitizeCssPropertyKey(key: string | undefined | null, fallback = 'invalid-key'): string {
  if (isValidCssPropertyKey(key)) {
    return key!;
  }
  // Try to sanitize by removing invalid characters
  if (key && typeof key === 'string') {
    const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized.length > 0 && /^[a-zA-Z]/.test(sanitized)) {
      return sanitized;
    }
  }
  return fallback;
}

/**
 * Escapes a string for safe use in CSS selectors.
 */
export function escapeCssSelector(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}
