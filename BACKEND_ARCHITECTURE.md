# SafeSpace Backend Architecture Documentation

## Overview

SafeSpace is a comprehensive mental health platform with a hybrid backend architecture that supports both web and mobile applications. The system combines real-time capabilities, robust authentication, and comprehensive data management for healthcare providers and clients.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Admin Panel   │
│   (Next.js)     │    │   (React Native)│    │   (Next.js)     │
└─────┬───────────┘    └─────┬───────────┘    └─────┬───────────┘
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │  (Next.js API)  │
                    │    72 Routes    │
                    └─────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
    │   Clerk   │    │  PostgreSQL │    │   Convex  │
    │   Auth    │    │  + Prisma   │    │ Real-time │
    └───────────┘    └─────────────┘    └───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
    │ Sendbird  │    │  SendGrid   │    │   Jitsi   │
    │   Chat    │    │   Email     │    │   Video   │
    └───────────┘    └─────────────┘    └───────────┘
```

## Core Technologies Stack

### Backend Services
- **Next.js 15.5.3** - Full-stack React framework with API routes
- **Node.js 20** - Runtime environment
- **PostgreSQL** - Primary relational database
- **Convex** - Real-time database for mobile and messaging features

### Authentication & Security
- **Clerk** - User authentication and management
- **JWT** - Token-based authentication
- **CSRF Protection** - Cross-site request forgery protection
- **Role-based Access Control** - Multi-level permissions system

### Communication Services
- **Sendbird** - Real-time chat and video calling
- **SendGrid** - Email notifications and communications
- **Jitsi Meet** - Video consultations (integrated via iframe)

### Database & ORM
- **Prisma** - Type-safe database ORM for PostgreSQL
- **Convex** - Real-time database with built-in subscriptions

## API Architecture

### HTTP Methods Distribution
- **GET**: 46 endpoints (63.9%) - Data retrieval
- **POST**: 25 endpoints (34.7%) - Data creation and actions
- **PUT**: 1 endpoint (1.4%) - Full resource updates
- **PATCH**: 1 endpoint (1.4%) - Partial updates
- **DELETE**: 1 endpoint (1.4%) - Resource deletion

### API Route Structure

```
/api/
├── admin/                     # Admin-only endpoints
│   ├── users/                # User management
│   ├── audit-logs/           # Compliance and monitoring
│   ├── system-monitoring/    # Health checks
│   ├── reports/              # Analytics and reporting
│   └── organizations/        # Multi-tenant management
├── users/                    # User operations
│   ├── create/              # User creation
│   ├── sync/                # Clerk synchronization
│   └── [email]/             # User lookup
├── clients/                  # Client management
│   ├── invite/              # Client onboarding
│   └── [id]/                # Individual client operations
├── appointments/             # Scheduling system
│   ├── today/               # Daily appointments
│   └── [id]/                # Individual appointments
├── notes/                    # Session documentation
├── referrals/               # Referral management
│   ├── mine/                # User's referrals
│   └── [id]/timeline/       # Referral tracking
├── crisis-events/           # Emergency response
├── notifications/           # Real-time notifications
├── sendbird/                # Chat integration
│   ├── members/             # Channel management
│   ├── mute/                # User controls
│   └── block/               # Moderation
├── messages/                # Direct messaging
└── webhooks/                # External integrations
    └── clerk/               # Authentication events
```

## Database Architecture

### PostgreSQL Schema (via Prisma)
The primary database handles structured data with strong consistency requirements:

#### Core Tables:
- **users** - User accounts and profiles
- **roles** - Role-based access control
- **clients** - Client information and demographics
- **appointments** - Scheduling and calendar data
- **notes** - Session documentation and clinical notes
- **referrals** - Intake and referral tracking
- **crisis_events** - Emergency response logging
- **audit_logs** - Compliance and security tracking
- **notifications** - System notifications

#### Relationships:
```sql
users (1) ←→ (n) clients           # User manages multiple clients
users (1) ←→ (n) appointments      # User schedules appointments
users (1) ←→ (n) notes             # User authors session notes
clients (1) ←→ (n) appointments    # Client has multiple appointments
clients (1) ←→ (n) notes           # Client has multiple notes
referrals (1) ←→ (n) timeline      # Referral has timeline entries
```

### Convex Real-time Database
Handles real-time features and mobile app data:

#### Key Collections:
- **organizations** - Multi-tenant organization management
- **conversations** - Real-time messaging
- **messages** - Chat message storage
- **presence** - User online status
- **communityPosts** - Community forum features
- **moods** - Mental health mood tracking
- **journalEntries** - Personal journaling
- **assessments** - Self-assessment tools
- **resources** - Educational content
- **videoCallSessions** - Video consultation logs

## Authentication & Authorization Flow

### User Authentication Process
1. **Initial Login** - User authenticates via Clerk
2. **JWT Token** - Clerk issues JWT with user metadata
3. **Role Assignment** - System assigns role-based permissions
4. **Session Management** - Middleware validates on each request
5. **Password Rotation** - Enforced 30-day password rotation for privileged roles

### Role Hierarchy
```
superadmin (Level 0) - System-wide administration
    ↓
admin (Level 1) - Organization administration
    ↓
team_leader (Level 2) - Team and client management
    ↓
support_worker (Level 3) - Direct client support
peer_support (Level 3) - Peer support services
    ↓
client (Level 4) - Service recipient
```

### Middleware Security
- **Route Protection** - Automatic authentication on API routes
- **Role Verification** - Real-time role checking via Clerk API
- **Security Headers** - CSP, CSRF, XSS protection
- **Password Policy** - Automatic password expiration enforcement

## Communication Systems

### Real-time Messaging (Sendbird)
```javascript
// User synchronization with Sendbird
const sendbirdResponse = await fetch(
  `https://api-${SENDBIRD_APP_ID}.sendbird.com/v3/users`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Token': process.env.SENDBIRD_API_TOKEN,
    },
    body: JSON.stringify({
      user_id: clerkUserId,
      nickname: `${firstName} ${lastName}`,
      profile_url: profileImageUrl,
    }),
  }
);
```

### Email Notifications (SendGrid)
- **System Notifications** - Appointment reminders, system alerts
- **Crisis Alerts** - Emergency notifications to supervisors
- **Referral Updates** - Status changes and assignment notifications

### Video Consultations
- **Jitsi Meet** - Embedded video calling platform
- **Sendbird Calls** - Alternative video calling solution
- **Session Logging** - Call duration and quality metrics

## Data Flow Patterns

### Typical Request Flow
1. **Client Request** → Next.js API Route
2. **Authentication** → Clerk JWT validation
3. **Authorization** → Role-based permission check
4. **Data Access** → Prisma/Convex query
5. **Business Logic** → Processing and validation
6. **Response** → JSON response with appropriate status

### Real-time Updates
1. **Event Trigger** → User action or system event
2. **Convex Mutation** → Real-time database update
3. **Subscription Notification** → Push to connected clients
4. **UI Update** → Automatic re-render in client applications

### Webhook Processing
```javascript
// Clerk webhook for user lifecycle events
export async function POST(req) {
  const evt = wh.verify(body, headers);
  
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    // Sync user data between Clerk and Convex
    const userInDb = await convex.query(api.users.getByClerkId, {
      clerkId: evt.data.id,
    });
    
    // Update Clerk metadata with database role
    await fetch(`https://api.clerk.com/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        public_metadata: { role: userInDb?.roleId },
      }),
    });
  }
}
```

## Security Implementation

### Input Validation
```typescript
function sanitizeString(input: string | undefined, maxLength = 200): string {
  if (!input) return "";
  const sanitized = input
    .replace(/[<>"'`]/g, "") // Remove dangerous characters
    .trim();
  return sanitized.slice(0, maxLength);
}

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
}
```

### Access Control
```typescript
// Role-based permission checking
export const requirePermission = async (ctx: any, permission: string) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
    
  if (!hasPermission(user?.roleId, permission)) {
    throw new Error("Insufficient permissions");
  }
};
```

### Security Headers
```typescript
// Comprehensive security headers in middleware
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
```

## Performance & Monitoring

### Database Optimization
- **Prisma Query Optimization** - Selective field queries and joins
- **Convex Real-time Subscriptions** - Efficient real-time data sync
- **Connection Pooling** - PostgreSQL connection management
- **Index Strategy** - Optimized database indexes for common queries

### Error Handling & Logging
```typescript
// Comprehensive error handling pattern
export async function POST(req: Request) {
  try {
    const result = await processRequest(req);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    
    // Audit logging for security events
    await logAuditEvent({
      action: 'API_ERROR',
      details: error.message,
      userId: currentUserId,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Health Monitoring
- **Database Health Checks** - Connection and query performance monitoring
- **API Response Times** - Performance metrics collection
- **User Session Tracking** - Active session monitoring
- **System Alerts** - Automated alerting for critical issues

## Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install

# Database setup
npx prisma generate
npx prisma db push
npx prisma db seed

# Convex setup
npx convex dev

# Start development server
npm run dev
```

### API Development Pattern
1. **Define Route** - Create API route file with HTTP methods
2. **Add Authentication** - Implement Clerk auth protection
3. **Validate Input** - Add input sanitization and validation
4. **Database Operations** - Use Prisma/Convex for data access
5. **Error Handling** - Implement comprehensive error catching
6. **Testing** - Test with different user roles and edge cases

### Deployment Architecture
- **Production Database** - Managed PostgreSQL instance
- **Convex Cloud** - Managed Convex deployment
- **Vercel/Cloud Platform** - Next.js application hosting
- **Environment Variables** - Secure credential management
- **Monitoring** - Application performance monitoring

## API Endpoints Reference

### Authentication
- `GET /api/auth/login` - User authentication status
- `POST /api/sync-role` - Role synchronization
- `POST /api/webhooks/clerk` - Clerk webhook handler

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users/create` - Create new user
- `GET /api/users/me` - Current user profile
- `POST /api/users/syncUser` - Sync user with Sendbird
- `GET /api/users/[email]` - Get user by email

### Client Operations
- `GET /api/clients` - List clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `POST /api/clients/invite` - Send client invitation

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/today` - Today's appointments
- `GET /api/appointments/[id]` - Get appointment details
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Cancel appointment

### Notes & Documentation
- `GET /api/notes` - List session notes
- `POST /api/notes` - Create session note
- `GET /api/notes/[id]` - Get note details
- `PUT /api/notes/[id]` - Update note

### Referral Management
- `GET /api/referrals` - List referrals
- `POST /api/referrals` - Create referral
- `GET /api/referrals/mine` - User's referrals
- `GET /api/referrals/[id]` - Get referral details
- `PUT /api/referrals/[id]` - Update referral status
- `GET /api/referrals/[id]/timeline` - Get referral timeline

### Crisis Management
- `GET /api/crisis-events` - List crisis events
- `POST /api/crisis-events` - Log crisis event
- `GET /api/crisis-events/[id]` - Get crisis event details

### Communication
- `POST /api/sendbird` - Sendbird user operations
- `POST /api/sendbird/members` - Channel member management
- `POST /api/sendbird/mute` - Mute user in channel
- `POST /api/sendbird/block` - Block user
- `GET /api/sendbird-calls-token` - Video call token
- `POST /api/send-email` - Send email notification

### Admin Operations
- `GET /api/admin/users` - Admin user management
- `POST /api/admin/users` - Create admin user
- `GET /api/admin/audit-logs` - System audit logs
- `GET /api/admin/database-health` - Database health check
- `GET /api/admin/metrics` - System metrics
- `GET /api/admin/system-uptime` - System uptime stats

### Notifications
- `GET /api/notifications` - List user notifications
- `POST /api/notifications` - Create notification
- `DELETE /api/notifications` - Clear notifications
- `POST /api/notifications/mark-as-read` - Mark as read

### Reports & Analytics
- `POST /api/reports` - Generate report
- `GET /api/metrics` - System metrics
- `GET /api/dashboard` - Dashboard data

This architecture provides a robust, scalable foundation for a comprehensive mental health platform with real-time capabilities, strong security, and comprehensive audit trails.