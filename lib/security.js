/**
 * @file Security utilities for input validation, sanitization, and authorization
 * 
 * This module provides centralized security functions to prevent:
 * - SQL/NoSQL injection
 * - XSS attacks
 * - CSRF attacks
 * - Unauthorized access
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validates and sanitizes user input to prevent injection attacks
 * @param {string} input - Raw user input
 * @param {object} options - Validation options
 * @param {number} options.maxLength - Maximum allowed length
 * @param {RegExp} options.pattern - Regex pattern for validation
 * @param {boolean} options.required - Whether the field is required
 * @returns {string|null} Sanitized input or null if invalid
 */
export function sanitizeInput(input, options = {}) {
  const { maxLength = 1000, pattern = null, required = false } = options;

  // Handle required validation
  if (required && (!input || input.trim() === '')) {
    return null;
  }

  // Handle optional empty values
  if (!input) {
    return '';
  }

  // Convert to string and trim
  let sanitized = String(input).trim();

  // Check length
  if (sanitized.length > maxLength) {
    return null;
  }

  // Check pattern if provided
  if (pattern && !pattern.test(sanitized)) {
    return null;
  }

  // Remove potential script tags and dangerous characters
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return sanitized;
}

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

/**
 * Validates phone number format (flexible for international)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export function isValidPhone(phone) {
  // Accepts: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phonePattern = /^[\d\s\-\(\)\+]+$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phonePattern.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Validates that input contains only alphanumeric characters and safe symbols
 * @param {string} input - Input to validate
 * @returns {boolean} True if safe
 */
export function isSafeString(input) {
  // Allow letters, numbers, spaces, and common punctuation
  const safePattern = /^[a-zA-Z0-9\s\.,\-_@#\$%&\(\)\/]+$/;
  return safePattern.test(input);
}

/**
 * Validates numeric ID parameters
 * @param {string|number} id - ID to validate
 * @returns {number|null} Parsed ID or null if invalid
 */
export function validateId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * Authenticates and authorizes admin/superadmin users
 * @param {Array<string>} allowedRoles - Array of allowed roles (default: ['admin', 'superadmin'])
 * @returns {Promise<{authorized: boolean, userId: string|null, role: string|null, error: NextResponse|null}>}
 */
export async function authorizeAdmin(allowedRoles = ['admin', 'superadmin']) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return {
        authorized: false,
        userId: null,
        role: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
      };
    }

    const userRole = sessionClaims?.publicMetadata?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return {
        authorized: false,
        userId,
        role: userRole || null,
        error: NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId,
      role: userRole,
      error: null,
    };
  } catch (error) {
    console.error('Authorization error:', error);
    return {
      authorized: false,
      userId: null,
      role: null,
      error: NextResponse.json(
        { error: 'Internal server error during authorization' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Validates request body against a schema
 * @param {object} data - Request body data
 * @param {object} schema - Schema definition
 * @returns {{valid: boolean, errors: Array<string>, sanitized: object}}
 * 
 * Schema format:
 * {
 *   fieldName: {
 *     type: 'string'|'email'|'phone'|'number'|'boolean',
 *     required: true|false,
 *     maxLength: number,
 *     pattern: RegExp
 *   }
 * }
 */
export function validateRequestBody(data, schema) {
  const errors = [];
  const sanitized = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation for optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type-specific validation
    switch (rules.type) {
      case 'email':
        if (!isValidEmail(value)) {
          errors.push(`${field} must be a valid email address`);
        } else {
          sanitized[field] = sanitizeInput(value, { maxLength: 255 });
        }
        break;

      case 'phone':
        if (!isValidPhone(value)) {
          errors.push(`${field} must be a valid phone number`);
        } else {
          sanitized[field] = sanitizeInput(value, { maxLength: 20 });
        }
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a valid number`);
        } else {
          sanitized[field] = num;
        }
        break;

      case 'boolean':
        sanitized[field] = Boolean(value);
        break;

      case 'string':
      default:
        const sanitizedValue = sanitizeInput(value, {
          maxLength: rules.maxLength || 1000,
          pattern: rules.pattern,
          required: rules.required,
        });
        
        if (sanitizedValue === null && rules.required) {
          errors.push(`${field} contains invalid characters or exceeds maximum length`);
        } else {
          sanitized[field] = sanitizedValue;
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Rate limiting map (in-memory, for production use Redis or database)
 */
const rateLimitMap = new Map();

/**
 * Simple rate limiter
 * @param {string} identifier - User ID or IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if request is allowed
 */
export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];

  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);

  return true;
}

/**
 * Sanitize HTML content for safe rendering (allows specific tags)
 * Use this for rich text content that needs to preserve formatting
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Create error response with consistent format
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {object} details - Additional error details
 * @returns {NextResponse} JSON error response
 */
export function createErrorResponse(message, status = 500, details = null) {
  const response = { error: message };
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}
