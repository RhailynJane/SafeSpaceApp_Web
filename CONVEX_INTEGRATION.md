# Convex Integration Guide for SafeSpace Web App

## Overview

SafeSpace has been migrated from Postgres/Prisma to Convex for real-time database capabilities and seamless integration with the mobile app.

## What's New

### SuperAdmin Features
- **Organization Management**: Create, edit, and manage organizations (CMHA Calgary, SAIT, Unaffiliated, etc.)
- **Account Management**: Full control over user accounts across all organizations
- **Role-Based Access Control**: Hierarchical permission system
- **Audit Logging**: Track all administrative actions
- **System Monitoring**: Health checks and system alerts

### Role Hierarchy
1. **SuperAdmin** (Level 0) - System-wide administrator
2. **Admin** (Level 1) - Organization administrator  
3. **Therapist** (Level 2) - Clinical staff
4. **Support Worker** (Level 2) - Support staff
5. **Client** (Level 3) - End users

## Getting Started

### 1. Install Dependencies
```bash
npm install convex
```

### 2. Set Up Convex
The Convex deployment is already configured in `.env.local`:
```
CONVEX_DEPLOYMENT=dev:formal-pigeon-483
NEXT_PUBLIC_CONVEX_URL=https://formal-pigeon-483.convex.cloud
```

### 3. Run Convex Development Server
```bash
npx convex dev
```

This will:
- Generate TypeScript types from your schema
- Watch for changes to Convex functions
- Sync your schema with the cloud

### 4. Seed Initial Data
After running `npx convex dev`, seed the database:

```bash
npx convex run seed:seedInitialData '{
  "superadminEmail": "your-email@example.com",
  "superadminClerkId": "your-clerk-user-id",
  "superadminFirstName": "Your",
  "superadminLastName": "Name"
}'
```

This will create:
- All role definitions (superadmin, admin, therapist, support_worker, client)
- Initial organizations (CMHA Calgary, SAIT, Unaffiliated)
- Your SuperAdmin account

### 5. Access SuperAdmin Portal
Navigate to: `http://localhost:3000/superadmin`

## Convex Functions

### Organizations (`convex/organizations.ts`)
- `list` - List all organizations (SuperAdmin only)
- `getBySlug` - Get organization by slug
- `create` - Create new organization
- `update` - Update organization details
- `remove` - Delete organization (with safety checks)
- `getStats` - Get organization statistics
- `listPublic` - Public list of active organizations

### Users (`convex/users.ts`)
- `list` - List users (filtered by organization for non-superadmins)
- `getByClerkId` - Get user by Clerk ID
- `getByEmail` - Get user by email
- `create` - Create new user account
- `update` - Update user account
- `remove` - Delete user (SuperAdmin only)
- `updateLastLogin` - Track login activity
- `getOrgUserStats` - Organization user statistics

### Roles (`convex/roles.ts`)
- `list` - List all roles
- `getBySlug` - Get role by slug
- `initializeRoles` - Initialize/update default roles
- `updatePermissions` - Update role permissions (SuperAdmin only)

### Auth (`convex/auth.ts`)
Utility functions for authorization:
- `hasPermission` - Check if user has specific permission
- `isSuperAdmin` - Check if user is SuperAdmin
- `isAdmin` - Check if user is Admin
- `getUserOrganization` - Get user's organization
- `hasOrgAccess` - Verify organization access
- `requirePermission` - Require permission or throw error
- `requireSuperAdmin` - Require SuperAdmin or throw error

## Database Schema

The schema is defined in `convex/schema.ts` and includes:

### Core Tables
- `organizations` - Organization entities
- `users` - User accounts with roles
- `roles` - Role definitions with permissions
- `clients` - Client/patient records
- `appointments` - Appointment scheduling
- `notes` - Session notes
- `referrals` - Referral management
- `crisisEvents` - Crisis event tracking
- `notifications` - User notifications
- `auditLogs` - Audit trail
- `systemAlerts` - System-wide alerts

### Mobile App Tables (Shared)
- `presence` - User online status
- `conversations` - Chat conversations
- `messages` - Chat messages
- `communityPosts` - Community forum posts
- `moods` - Mood tracking
- `journalEntries` - Personal journaling
- `resources` - Mental health resources
- `assessments` - Self-assessments
- `settings` - User preferences

## Permissions System

Permissions are defined in `convex/auth.ts`:

### SuperAdmin Permissions
- All organization management
- All user management
- Full system access

### Admin Permissions
- Organization-scoped user management
- Client management
- Referral processing
- Report generation

### Therapist Permissions
- Client management
- Session notes
- Appointments
- Crisis management

### Support Worker Permissions
- Limited client access
- Session notes
- Appointments

## Migration from Prisma

### Before (Prisma)
```typescript
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany();
```

### After (Convex)
```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const users = useQuery(api.users.list, { clerkId: user.id });
```

## SuperAdmin Portal Routes

- `/superadmin` - Overview dashboard
- `/superadmin/organizations` - Organization list
- `/superadmin/organizations/create` - Create organization
- `/superadmin/organizations/[slug]` - Organization details
- `/superadmin/organizations/[slug]/edit` - Edit organization
- `/superadmin/accounts` - Account management
- `/superadmin/accounts/create` - Create account
- `/superadmin/accounts/[clerkId]` - Account details
- `/superadmin/accounts/[clerkId]/edit` - Edit account
- `/superadmin/audit-logs` - Audit log viewer
- `/superadmin/system` - System health monitoring

## Next Steps

1. **Initialize Convex**: Run `npx convex dev`
2. **Seed Data**: Run the seed mutation with your SuperAdmin details
3. **Test SuperAdmin Portal**: Access `/superadmin` and verify functionality
4. **Migrate API Routes**: Gradually replace Prisma calls with Convex queries/mutations
5. **Update Mobile App**: Ensure mobile app is using the same Convex deployment

## Development Workflow

1. Start Next.js dev server: `npm run dev`
2. Start Convex dev server (separate terminal): `npx convex dev`
3. Make changes to schema or functions in `convex/` directory
4. Convex automatically syncs changes

## Important Notes

- The same Convex deployment is shared between web and mobile apps
- SuperAdmin access is restricted to users with `roleId: "superadmin"`
- Always use Convex functions with proper authorization checks
- Audit logs are automatically created for sensitive operations
- Organizations cannot be deleted if they have active users

## Troubleshooting

### Convex types not found
Run: `npx convex dev` - this generates TypeScript types

### Permission denied errors
Ensure your user has the `superadmin` role in the database

### Environment variables not loading
Restart Next.js dev server after changing `.env.local`

## Support

For issues or questions, refer to:
- [Convex Documentation](https://docs.convex.dev)
- [SafeSpace Project Documentation](./README.md)
