/**
 * Explicit security policy; never grant privileges based on client input.
 * Existing seeded/demo users require separate database remediation before live launch.
 */
export function secretForEnvironment(value: unknown, production: boolean): string {
  if (production) {
    if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') < 32) {
      throw new Error('Production requires a unique JWT_SECRET of at least 32 bytes.');
    }
    return value;
  }
  return typeof value === 'string' && value ? value : 'development-only-not-for-production';
}

export function validateSelfRegistration(data: {
  email?: unknown; name?: unknown; password?: unknown; role?: unknown;
}): boolean {
  return (data.role === 'vendor' || data.role === 'customer')
    && typeof data.email === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    && typeof data.name === 'string' && data.name.trim().length > 0
    && typeof data.password === 'string'
    && data.password.length >= 15 && data.password.length <= 128;
}

export function allowDemoSeed(production: boolean, flag: unknown): boolean {
  return !production && flag === '1';
}
