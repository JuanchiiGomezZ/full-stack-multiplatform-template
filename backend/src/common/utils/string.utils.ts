/**
 * String utility functions
 * Generic string manipulation helpers for any project
 */

/**
 * Convert text to URL-friendly slug
 * @example slugify('Hello World!') => 'hello-world'
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
}

/**
 * Truncate text to specified length with ellipsis
 * @example truncate('Hello World', 5) => 'Hello...'
 */
export function truncate(text: string, length: number, suffix = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

/**
 * Capitalize first letter of text
 * @example capitalize('hello') => 'Hello'
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert text to camelCase
 * @example toCamelCase('hello-world') => 'helloWorld'
 */
export function toCamelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) =>
      char ? char.toUpperCase() : '',
    );
}

/**
 * Convert text to snake_case
 * @example toSnakeCase('helloWorld') => 'hello_world'
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[-\s]+/g, '_');
}

/**
 * Generate cryptographically secure random string
 * Useful for tokens, session IDs, etc.
 * @example generateRandomString(16) => 'a1b2c3d4e5f6g7h8'
 */
export function generateRandomString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
}

/**
 * Mask email address for privacy
 * @example maskEmail('john.doe@gmail.com') => 'j*******@gmail.com'
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal =
    local.length <= 2
      ? '*'.repeat(local.length)
      : local[0] + '*'.repeat(local.length - 1);

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for privacy
 * @example maskPhone('+5491155556789') => '+549115****89'
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '*'.repeat(phone.length);

  const prefix = phone.startsWith('+') ? '+' : '';
  const visibleStart = digits.slice(0, 5);
  const visibleEnd = digits.slice(-2);
  const maskedMiddle = '*'.repeat(digits.length - 7);

  return `${prefix}${visibleStart}${maskedMiddle}${visibleEnd}`;
}

/**
 * Remove all HTML tags from text
 * @example stripHtml('<p>Hello</p>') => 'Hello'
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Check if string is a valid JSON
 */
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
