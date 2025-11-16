# Security Documentation

## Overview
This document outlines the security measures implemented in the SafeSpace application, particularly for the SuperAdmin functionality.

## Authentication & Authorization

### Clerk Integration
- **Authentication**: All users must authenticate through Clerk
- **Role-Based Access Control (RBAC)**: 5 roles defined (superadmin, admin, client, team_lead, support_worker)
- **Middleware Protection**: `middleware.ts` verifies roles via Clerk API (not just metadata)
  - `/admin/*` routes require `admin` or `superadmin` role
  - `/superadmin/*` routes require `superadmin` role only
  - Unauthorized access redirects to `/unauthorized`

### Convex Backend Authorization
- **requireSuperAdmin()**: Helper function in `convex/auth.ts` throws error if user is not superadmin
- **requirePermission()**: Checks user permissions based on role
- **All mutations**: Protected with authorization checks before any data modification

## Input Validation & Sanitization

### Organizations (`convex/organizations.ts`)
- **sanitizeString(input, maxLength)**: Removes XSS characters (`<>"'\``), trims, enforces length limits
- **validateSlug(slug)**: 
  - Regex: `/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/` (alphanumeric + hyphens, 3-50 chars)
  - Reserved words blocked: `admin`, `api`, `superadmin`, `system`, `root`, `safespace`
- **validateEmail(email)**: Format validation via regex
- **validateUrl(url)**: Protocol whitelist (http/https only)
- **safespace org protection**: Cannot modify or delete the safespace organization

### Users (`convex/users.ts`)
- **sanitizeString()**: Applied to all text inputs (names, addresses, phone)
- **validateEmail()**: Email format and length validation
- **validatePhoneNumber()**: Alphanumeric + special chars only, 20 char max
- **validateRoleId()**: Whitelist of valid roles
- **validateStatus()**: Whitelist of valid statuses (active, inactive, suspended)
- **Length limits**: 
  - Names: 100 chars
  - Email: 255 chars
  - Phone: 20 chars
  - Address: 500 chars

### Feature Permissions (`convex/featurePermissions.ts`)
- **validateFeatureKey()**: Whitelist approach - only 10 defined features allowed
- **safespace org protection**: Cannot modify feature permissions for safespace org
- **SuperAdmin requirement**: All mutations require SuperAdmin role

### Audit Logs (`convex/auditLogs.ts`)
- **validateAction()**: Required, max 100 chars
- **validateEntityType()**: Whitelist of valid entity types
- **Sanitization**: All inputs sanitized with appropriate length limits
- **Length limits**:
  - Action: 100 chars
  - Entity type: 50 chars
  - Details: 2000 chars
  - IP address: 45 chars (IPv6)
  - User agent: 500 chars

## XSS Protection
All user-provided text inputs are sanitized by removing potentially dangerous characters:
- `<` (less than)
- `>` (greater than)
- `"` (double quote)
- `'` (single quote)
- `` ` `` (backtick)

This prevents script injection and HTML tag injection attacks.

## NoSQL Injection Prevention
- **Convex uses NoSQL**: Not vulnerable to traditional SQL injection
- **Type validation**: All inputs validated against expected types (string, number, boolean)
- **Whitelist approach**: Enums and predefined values used where possible
- **No direct query string interpolation**: All database queries use Convex's type-safe API

## Reserved Resource Protection
- **safespace organization**: 
  - Cannot be modified via `organizations.update`
  - Cannot be deleted via `organizations.remove`
  - Feature permissions cannot be changed
  - Prevents system compromise

- **Reserved slugs**: Blocked from creation
  - `admin`, `api`, `superadmin`, `system`, `root`, `safespace`
  - Prevents path traversal and system route conflicts

## Rate Limiting
⚠️ **TODO**: Implement rate limiting for mutation endpoints
- Consider using Clerk's built-in rate limiting
- Add custom throttling for high-risk mutations (create/delete operations)
- Track failed auth attempts

## CSRF Protection
✅ **Handled by Clerk**: Clerk provides CSRF protection for authentication flows
✅ **Convex**: Built-in protection via authentication tokens
- All mutations require valid Clerk session token
- Tokens are short-lived and rotated

## Session Management
✅ **Clerk manages sessions**:
- Automatic token rotation
- Secure cookie handling
- Session expiration
- Multi-device session tracking

## Audit Trail
All critical operations are logged:
- User creation/update/deletion
- Organization creation/update/deletion
- Feature permission changes
- Logs include: userId, action, entityType, entityId, details, timestamp
- Audit logs are **append-only** (no delete mutation)

## Best Practices for Future Development

### When Adding New Mutations:
1. **Always** call `requireSuperAdmin()` or `requirePermission()` at the start
2. **Validate** all inputs against expected formats/types
3. **Sanitize** all string inputs using `sanitizeString()`
4. **Whitelist** enum values instead of accepting arbitrary strings
5. **Enforce length limits** on all text fields
6. **Log** all mutations to auditLogs table
7. **Test** authorization bypass attempts

### Input Validation Checklist:
- [ ] Email: Format + length validation
- [ ] Slug: Regex + reserved word check
- [ ] URL: Protocol whitelist
- [ ] Phone: Character whitelist + length
- [ ] Text: XSS sanitization + length limits
- [ ] Enums: Whitelist validation
- [ ] Numbers: Range validation
- [ ] Dates: Valid timestamp check

### Security Testing:
- Test unauthorized access attempts (wrong role, no auth)
- Test XSS injection in all text fields
- Test reserved word bypasses (slug variations)
- Test length limit bypasses (very long strings)
- Test concurrent modification races
- Test safespace org protection

## Known Limitations
1. **No rate limiting**: Currently no protection against DoS via rapid mutations
2. **No IP-based blocking**: No automatic blocking of suspicious IPs
3. **No MFA requirement**: SuperAdmin accounts should require multi-factor authentication (consider Clerk MFA)
4. **No data encryption at rest**: Sensitive fields (emergency contacts, addresses) not encrypted in database

## Security Contacts
- Report security vulnerabilities to: [security contact email]
- Include: affected endpoint, reproduction steps, impact assessment

## Change Log
- **2025-01-XX**: Initial security implementation
  - Added input validation to organizations, users, featurePermissions, auditLogs
  - Implemented XSS protection
  - Added reserved word/resource protection
  - Added audit logging to all mutations
