/**
 * Shared sanitization utilities for consistent data sanitization across the application.
 * Prevents XSS, injection attacks, and ensures data consistency.
 */

/**
 * Sanitizes a string value by trimming whitespace.
 * Returns undefined if the input is undefined or empty after trimming.
 *
 * @param value - The string value to sanitize
 * @returns The trimmed string or undefined
 *
 * @example
 * ```ts
 * sanitizeString('  hello  ') // 'hello'
 * sanitizeString('   ') // undefined
 * sanitizeString(undefined) // undefined
 * ```
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Sanitizes person data by trimming all string fields.
 * This ensures consistent data storage and prevents whitespace-only entries.
 *
 * @param data - The person data to sanitize
 * @returns Sanitized person data
 */
export function sanitizePersonData<T extends Record<string, unknown>>(
  data: T
): T {
  const sanitized = { ...data };

  // Trim string fields if they exist
  if (sanitized.firstName && typeof sanitized.firstName === 'string') {
    (sanitized as any).firstName = sanitized.firstName.trim();
  }
  if (sanitized.lastName && typeof sanitized.lastName === 'string') {
    (sanitized as any).lastName = sanitized.lastName.trim();
  }
  if (sanitized.middleName && typeof sanitized.middleName === 'string') {
    (sanitized as any).middleName = sanitizeString(sanitized.middleName as string);
  }
  if (sanitized.biography && typeof sanitized.biography === 'string') {
    (sanitized as any).biography = sanitizeString(sanitized.biography as string);
  }

  return sanitized;
}

/**
 * Sanitizes user input for safe use in MongoDB regex queries.
 * Escapes regex special characters to prevent NoSQL injection attacks.
 *
 * @param input - The user input string to sanitize
 * @returns A sanitized string safe for use in regex patterns
 *
 * @example
 * ```ts
 * sanitizeRegexInput('test.*') // 'test\\.\\*'
 * sanitizeRegexInput('hello|world') // 'hello\\|world'
 * ```
 */
export function sanitizeRegexInput(input: string): string {
  // Escape all regex special characters: . * + ? ^ $ { } ( ) | [ ] \
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a file name by removing potentially dangerous characters.
 * Prevents path traversal attacks and ensures valid file names.
 *
 * @param filename - The file name to sanitize
 * @returns A sanitized file name
 *
 * @example
 * ```ts
 * sanitizeFileName('../../etc/passwd') // 'etcpasswd'
 * sanitizeFileName('photo.jpg') // 'photo.jpg'
 * ```
 */
export function sanitizeFileName(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove invalid filename characters
    .trim();
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Strips all HTML tags by default, preserving only text content.
 *
 * @param html - The HTML content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized text content
 *
 * @example
 * ```ts
 * sanitizeHTML('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeHTML('<p>Hello <b>world</b></p>') // 'Hello world'
 * ```
 */
export function sanitizeHTML(html: string | undefined): string {
  if (!html) return '';

  // Simple HTML sanitization - strip all tags
  // For production, consider using a library like DOMPurify or sanitize-html
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all other HTML tags
    .trim();
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: URL attacks.
 *
 * @param url - The URL to validate
 * @returns The sanitized URL or null if invalid
 *
 * @example
 * ```ts
 * sanitizeURL('javascript:alert(1)') // null
 * sanitizeURL('https://example.com/image.jpg') // 'https://example.com/image.jpg'
 * ```
 */
export function sanitizeURL(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
