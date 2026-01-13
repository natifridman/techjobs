/**
 * Shared validation utilities for input sanitization and validation
 */

/**
 * Validates if a string is a valid UUID v1-5 format
 */
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Validates if a string is a valid URL with optional max length check
 * Only allows http and https protocols for security
 */
export const isValidUrl = (str: string, maxLength: number = 2048): boolean => {
  if (!str || typeof str !== 'string') return false;
  try {
    const url = new URL(str);
    const allowedProtocols = ['http:', 'https:'];
    return allowedProtocols.includes(url.protocol) && str.length <= maxLength;
  } catch {
    return false;
  }
};

/**
 * Validates company/entity name
 * - Must not be empty after trimming
 * - Must not exceed maxLength (default 200)
 */
export const isValidName = (str: string, maxLength: number = 200): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
};
