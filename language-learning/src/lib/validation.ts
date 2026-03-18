/**
 * Shared input validation and sanitization utilities.
 * Used across all API routes for consistent input handling.
 */

/**
 * Sanitizes user input by encoding HTML special characters to prevent XSS attacks.
 * Converts <, >, ", ' to their HTML entity equivalents.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates email format using a standard regex pattern.
 * Covers most common email formats (RFC 5322 simplified).
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates that a string field meets length requirements.
 * Returns an error message if invalid, or null if valid.
 */
export function validateLength(
  value: unknown,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 500
): string | null {
  if (typeof value !== "string") {
    return `${fieldName} يجب أن يكون نصاً`;
  }
  if (value.trim().length < minLength) {
    return `${fieldName} يجب أن يكون ${minLength} حرف على الأقل`;
  }
  if (value.trim().length > maxLength) {
    return `${fieldName} يجب أن لا يتجاوز ${maxLength} حرف`;
  }
  return null;
}

/**
 * Validates a value against a whitelist of allowed values.
 * Returns the value if valid, or the default value if not.
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: T[],
  defaultValue: T
): T {
  if (typeof value === "string" && allowedValues.includes(value as T)) {
    return value as T;
  }
  return defaultValue;
}
