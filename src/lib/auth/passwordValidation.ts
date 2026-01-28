/**
 * Password Validation Utility
 *
 * Provides password validation according to security requirements.
 */

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
};

/**
 * Validate a password against security requirements.
 *
 * @param password - Password to validate
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns Array of error messages (empty if valid)
 *
 * @example
 * ```ts
 * const errors = validatePassword('password123');
 * if (errors.length > 0) {
 *   console.log('Password errors:', errors);
 * }
 * ```
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const errors: string[] = [];

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters`);
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must be at most ${requirements.maxLength} characters`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
}

/**
 * Check if a password meets all requirements.
 *
 * @param password - Password to check
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns True if password is valid
 */
export function isValidPassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): boolean {
  return validatePassword(password, requirements).length === 0;
}

/**
 * Hash a password using bcrypt.
 *
 * @param password - Plain text password
 * @returns Hashed password
 *
 * @example
 * ```ts
 * const hashedPassword = await hashPassword('MyPassword123');
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash.
 *
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash
 *
 * @example
 * ```ts
 * const isValid = await verifyPassword('MyPassword123', hashedPassword);
 * ```
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random password.
 *
 * @param length - Length of password (default 16)
 * @returns Randomly generated password
 *
 * @example
 * ```ts
 * const randomPassword = generateSecurePassword(16);
 * ```
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let password = '';
  let allChars = lowercase + uppercase + numbers;

  // Ensure at least one of each required type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Add special chars if required
  if (DEFAULT_PASSWORD_REQUIREMENTS.requireSpecialChar) {
    allChars += special;
    password += special[Math.floor(Math.random() * special.length)];
  }

  // Fill remaining length with random chars
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Calculate password strength score.
 *
 * @param password - Password to evaluate
 * @returns Strength score (0-4, where 4 is strongest)
 *
 * @example
 * ```ts
 * const strength = getPasswordStrength('MyPassword123!');
 * // Returns: 4 (very strong)
 * ```
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * Get human-readable password strength label.
 *
 * @param password - Password to evaluate
 * @returns Strength label
 *
 * @example
 * ```ts
 * const label = getPasswordStrengthLabel('MyPassword123!');
 * // Returns: 'Very Strong'
 * ```
 */
export function getPasswordStrengthLabel(password: string): string {
  const strength = getPasswordStrength(password);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return labels[strength];
}
