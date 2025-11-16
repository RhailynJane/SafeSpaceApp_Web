/**
 * @file CSRF Protection Utilities
 * 
 * This module provides Cross-Site Request Forgery (CSRF) protection for state-changing operations.
 * CSRF tokens are automatically generated and validated to prevent unauthorized requests.
 * 
 * Note: Clerk's built-in session tokens already provide CSRF protection for authenticated requests.
 * This module provides additional explicit CSRF validation for critical operations.
 */

import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

/**
 * In-memory CSRF token store (for production, use Redis or database)
 * Key: userId, Value: { token: string, expiresAt: number }
 */
const csrfTokenStore = new Map();

/**
 * Token expiry time (15 minutes)
 */
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

/**
 * Clean up expired tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, tokenData] of csrfTokenStore.entries()) {
    if (tokenData.expiresAt < now) {
      csrfTokenStore.delete(userId);
    }
  }
}, 60000); // Run cleanup every minute

/**
 * Generate a CSRF token for the current user
 * @returns {Promise<{token: string, error: string|null}>}
 */
export async function generateCsrfToken() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { token: null, error: 'Unauthorized' };
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    // Store the token
    csrfTokenStore.set(userId, { token, expiresAt });

    return { token, error: null };
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return { token: null, error: 'Failed to generate CSRF token' };
  }
}

/**
 * Validate a CSRF token
 * @param {string} token - The CSRF token to validate
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export async function validateCsrfToken(token) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { valid: false, error: 'Unauthorized' };
    }

    if (!token) {
      return { valid: false, error: 'CSRF token missing' };
    }

    const storedData = csrfTokenStore.get(userId);
    if (!storedData) {
      return { valid: false, error: 'CSRF token not found or expired' };
    }

    // Check expiry
    if (storedData.expiresAt < Date.now()) {
      csrfTokenStore.delete(userId);
      return { valid: false, error: 'CSRF token expired' };
    }

    // Validate token using constant-time comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedData.token),
      Buffer.from(token)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token' };
    }

    // Token is valid - optionally delete it for one-time use
    // csrfTokenStore.delete(userId);

    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return { valid: false, error: 'CSRF validation failed' };
  }
}

/**
 * Middleware helper to validate CSRF token from request headers
 * @param {Request} req - The incoming request
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export async function validateCsrfFromRequest(req) {
  // Get token from header or body
  const token = req.headers.get('X-CSRF-Token') || 
                (await req.json().catch(() => ({}))).csrfToken;

  return validateCsrfToken(token);
}

/**
 * NOTE: Clerk's authentication already provides CSRF protection through:
 * 1. SameSite cookie attributes on session tokens
 * 2. Origin and Referer header validation
 * 3. Short-lived session tokens
 * 
 * The explicit CSRF token validation in this module provides an additional
 * layer of security for critical operations like:
 * - User deletion
 * - Password resets
 * - Role changes
 * - Financial transactions
 * 
 * For most API routes, Clerk's built-in protection is sufficient.
 */
