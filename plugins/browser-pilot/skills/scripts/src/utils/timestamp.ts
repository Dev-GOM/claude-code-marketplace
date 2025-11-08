/**
 * Timestamp utilities for local time formatting
 */

/**
 * Get ISO 8601 timestamp (recommended for logs)
 * Format: 2025-11-08T23:17:47.123Z
 * Example: 2025-11-08T23:17:47.123Z
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get local timestamp string in format: YYYY-MM-DD HH:MM:SS
 * Example: 2025-11-08 23:17:47
 */
export function getLocalTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get local timestamp with timezone information
 * Format: YYYY-MM-DD HH:MM:SS (UTC+X)
 * Example: 2025-11-08 23:17:47 (UTC+9)
 */
export function getLocalTimestampWithTZ(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Get timezone offset in hours
  const offset = -now.getTimezoneOffset() / 60;
  const offsetStr = offset >= 0 ? `+${offset}` : String(offset);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC${offsetStr})`;
}
