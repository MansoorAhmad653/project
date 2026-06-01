import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'medicart-fallback-secret';
const COOKIE_NAME = 'medicart_session';

/**
 * Verify a password against a Django PBKDF2-SHA256 hash.
 * Django hash format: "pbkdf2_sha256$iterations$salt$hash"
 */
export function verifyDjangoPassword(password, djangoHash) {
  try {
    const parts = djangoHash.split('$');
    if (parts.length !== 4) return false;

    const [algorithm, iterationsStr, salt, storedHash] = parts;
    if (algorithm !== 'pbkdf2_sha256') return false;

    const iterations = parseInt(iterationsStr, 10);
    const keyLength = Buffer.from(storedHash, 'base64').length;

    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      keyLength,
      'sha256'
    );

    const derivedHash = derivedKey.toString('base64');
    return crypto.timingSafeEqual(
      Buffer.from(derivedHash),
      Buffer.from(storedHash)
    );
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Create a Django-compatible PBKDF2-SHA256 hash for a new password.
 */
export function hashPassword(password) {
  const iterations = 870000;
  const salt = crypto.randomBytes(16).toString('base64').replace(/[=+/]/g, '');
  const keyLength = 32;

  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    keyLength,
    'sha256'
  );

  return `pbkdf2_sha256$${iterations}$${salt}$${derivedKey.toString('base64')}`;
}

/**
 * Sign a JWT token with user data.
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_staff: user.is_staff,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT token and return the decoded payload.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Get the current user from the session cookie (for API routes).
 */
export async function getCurrentUser(request) {
  try {
    const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookieValue) return null;
    return verifyToken(cookieValue);
  } catch {
    return null;
  }
}

/**
 * Get the current user from cookies() in server components or route handlers.
 */
export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Create a Set-Cookie header string for setting the session.
 */
export function createSessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;
}

/**
 * Create a Set-Cookie header string for clearing the session.
 */
export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0;`;
}

export { COOKIE_NAME };
