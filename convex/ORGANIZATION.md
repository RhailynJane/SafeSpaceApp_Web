# Convex Backend Organization

This directory contains all Convex backend functions organized by feature and access level.

## Directory Structure

```
convex/
├── _generated/          # Auto-generated Convex types (do not edit)
├── admin/              # Admin-only functions (future organization)
├── public/             # Public/client-facing functions (future organization)
├── mobile/             # Mobile-specific functions
├── schema.ts           # Database schema definition
├── auth.ts             # Authentication & authorization helpers
├── users.ts            # User management functions
├── organizations.ts    # Organization management
├── roles.ts            # Role management
├── clients.ts          # Client management
├── appointments.ts     # Appointment scheduling
├── notes.ts            # Notes management
├── referrals.ts        # Referral tracking
├── reports.ts          # Reporting functions
├── announcements.ts    # Announcement system
├── announcementActions.ts # Announcement actions with images
├── notifications.ts    # Notification system
├── auditLogs.ts        # Audit logging
├── systemAlerts.ts     # System alerts
├── systemHealth.ts     # System health monitoring
├── metrics.ts          # System metrics
├── presence.ts         # User presence tracking
├── featurePermissions.ts # Feature permissions
├── helpers.ts          # Shared helper functions
└── seed.ts             # Database seeding functions
```

## File Naming Conventions

- **camelCase**: Use camelCase for file names (e.g., `users.ts`, `systemHealth.ts`)
- **Descriptive**: Names should clearly indicate the feature or domain
- **Singular/Plural**: Collections use plural (e.g., `users.ts`), utilities use singular

## Function Export Patterns

### Queries (Read Operations)
```typescript
export const list = query({
  args: { clerkId: v.string(), ... },
  handler: async (ctx, args) => { ... }
});
```

### Mutations (Write Operations)
```typescript
export const create = mutation({
  args: { clerkId: v.string(), ... },
  handler: async (ctx, args) => { ... }
});
```

### Actions (External API Calls)
```typescript
export const sendEmail = action({
  args: { ... },
  handler: async (ctx, args) => { ... }
});
```

## Access Control

All functions use role-based access control (RBAC):

- `requireSuperAdmin()`: SuperAdmin-only access
- `requirePermission()`: Permission-based access
- `hasOrgAccess()`: Organization-scoped access
- `isSuperAdmin()`: Check if user is SuperAdmin

## Security Best Practices

1. **Always authenticate**: Every function should validate the `clerkId` parameter
2. **Sanitize inputs**: Use validation helpers for user inputs
3. **Check permissions**: Use auth helpers before modifying data
4. **Audit logging**: Log sensitive operations to `auditLogs`
5. **Organization isolation**: Ensure users can only access their org's data

## Migration from Prisma

This project has been fully migrated from Prisma to Convex:

✅ All user management operations
✅ Organization and role management
✅ Client and appointment tracking
✅ Notes and referrals
✅ Audit logs and system monitoring
✅ Announcements and notifications

## Future Enhancements

- Move admin-specific functions to `admin/` directory
- Move public functions to `public/` directory
- Create `webhooks/` directory for external integrations
- Add more granular permission controls
- Implement data validation schemas
