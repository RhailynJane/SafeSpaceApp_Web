# Bidirectional Appointment Sync Guide

## Overview

This document describes the bidirectional appointment synchronization system that allows clients and support workers to create and view appointments across web and mobile platforms in real-time.

## Architecture

### Unified Appointment Schema

Both web and mobile platforms use the same `appointments` table in Convex with compatible field naming:

```typescript
// Web format
appointmentDate: "2024-01-15"     // YYYY-MM-DD
appointmentTime: "14:30"          // HH:mm

// Mobile format (same data, alternative field names)
date: "2024-01-15"
time: "14:30"

// Both platforms store the same data in BOTH formats for compatibility
```

### Client/User Linking

| Platform | Field | Value | Syncs With |
|----------|-------|-------|-----------|
| Web | clientId | Clerk ID or DB ID | Mobile's userId |
| Mobile | userId | Client's Clerk ID | Web's clientId |
| Both | clientId / userId | Same value | Cross-platform visibility |

### Support Worker Linking

| Field | Type | Purpose |
|-------|------|---------|
| supportWorkerId | Clerk ID (string) | Uniquely identifies worker across platforms |
| supportWorker | Full name | Human-readable display name |
| avatarUrl | Image URL | Profile picture for mobile UI |

## Appointment Creation Flow

### Mobile Client Creating Appointment

```typescript
// Mobile client.tsx calls:
convex.mutation(api.appointments.createAppointment, {
  userId: userClerkId,           // Client's own Clerk ID
  supportWorker: "Jane Doe",      // Support worker name
  supportWorkerId: "user_xxx",    // Worker's Clerk ID (optional, looked up by name)
  date: "2024-01-15",
  time: "14:30",
  type: "video",
  notes: "Discuss anxiety management",
  orgId: "cmha-calgary",          // NEW: Organization for web sync
})

// Handler:
1. Resolves supportWorkerId from worker name if not provided
2. Checks worker's availability (day of week must be enabled)
3. Creates appointment with BOTH field formats:
   - date/time (mobile format)
   - appointmentDate/appointmentTime (web format)
4. Stores userId = clientId for cross-platform visibility
5. Logs activity and creates notification
```

**Result**: Appointment appears instantly in web support worker's dashboard

### Web Support Worker Creating Appointment

```typescript
// Web AddAppointmentModal calls:
convex.mutation(api.appointments.create, {
  clerkId: workerClerkId,
  clientDbId: selectedClientId,   // Selected from dropdown
  appointmentDate: "2024-01-15",
  appointmentTime: "14:30",
  type: "video",
  notes: "Initial assessment",
  supportWorkerId: "user_xxx",    // Optional; if omitted for CMHA, auto-assigns
  orgId: "cmha-calgary",
})

// Handler:
1. Auto-assigns least-loaded support worker if orgId=cmha-calgary and no supportWorkerId
2. Fetches support worker details (name, avatar) from users table
3. Checks worker availability (day of week, time range)
4. Creates appointment with BOTH field formats:
   - appointmentDate/appointmentTime (web format)
   - date/time (mobile format)
5. Stores clientId = userId for cross-platform visibility
6. Logs audit trail
```

**Result**: Appointment appears instantly in client's mobile app and support worker's calendar

## Support Worker Availability System

### Availability Data Structure

```typescript
// In users table
availability: [
  {
    day: "monday",           // Case-insensitive
    enabled: true,
    startTime: "09:00",      // HH:mm
    endTime: "17:00"         // HH:mm
  },
  // ... one entry per day
]
```

### Availability Checking Flow

**Mobile (`createAppointment`)**:
```typescript
const appointmentDate = new Date(args.date);
const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
const daySlot = worker.availability.find(slot => slot.day.toLowerCase() === dayOfWeek);

if (!daySlot?.enabled) {
  console.warn(`Worker not available on ${dayOfWeek}`);
  // Current behavior: logs warning, still creates appointment
  // Future: could set status to "pending_approval" or throw error
}
```

**Web (`create`)**:
```typescript
const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'lowercase' });
const daySlot = worker.availability.find(slot => slot.day?.toLowerCase() === dayOfWeek);

if (daySlot && !daySlot.enabled) {
  console.warn(`Worker ${assignedWorkerClerkId} is not available on ${dayOfWeek}`);
  // Current behavior: logs warning, still creates appointment
}
```

**Note**: Both systems currently log warnings but don't block appointment creation. This allows urgent appointments to be scheduled outside normal hours. Future enhancement could enforce strict availability checking by status.

## Querying Appointments Across Platforms

### Mobile Client Views Their Appointments

```typescript
// Use the getUserAppointments query with userId (Clerk ID)
const appointments = await convex.query(api.appointments.getUserAppointments, {
  userId: clientClerkId,
  includeStatus: ["scheduled", "confirmed"],
})

// Returns appointments created by:
// 1. Client themselves (via mobile createAppointment)
// 2. Support workers (via web create mutation)
// All stored with userId or clientId matching the client
```

### Web Support Worker Views Their Appointments

```typescript
// Use listByDate or list query with orgId
const appointments = await convex.query(api.appointments.list, {
  clerkId: workerClerkId,
  orgId: "cmha-calgary",
})

// Returns all appointments in the organization
// Filter locally for ones assigned to specific worker (supportWorkerId field)
```

## Field Mapping Reference

| Field | Web Source | Mobile Source | Type | Purpose |
|-------|-----------|---------------|------|---------|
| appointmentDate | Form input | Auto from date | string | YYYY-MM-DD format |
| appointmentTime | Form input | Auto from time | string | HH:mm format |
| date | Auto from appointmentDate | Form input | string | YYYY-MM-DD format |
| time | Auto from appointmentTime | Form input | string | HH:mm format |
| clientId | User selection | Client's userId | string | Appointment's client |
| userId | Auto from clientId | Client's Clerk ID | string | Appointment's client |
| supportWorkerId | Auto-assigned or selected | Looked up from name | string | Worker's Clerk ID |
| supportWorker | Fetched from worker record | User input | string | Worker's full name |
| avatarUrl | Fetched from worker record | Avatar URL param | string | Worker's profile pic |
| type | Selection | Selection | string | video/phone/in_person |
| duration | Input | Input | number | Minutes (default 60) |
| notes | Input | Input | string | Notes/description |
| meetingLink | Input | Input | string | Video call link if type=video |
| status | Default "scheduled" | Default "scheduled" | string | scheduled/confirmed/completed/cancelled/no_show |
| orgId | Inferred from client | Parameter | string | For CMHA auto-assignment |

## Testing Bidirectional Sync

### Test Scenario 1: Mobile Client Creates Appointment

```
1. Open mobile app as client
2. Select support worker "Jane Doe"
3. Choose date: 2024-01-15, time: 14:30
4. Add notes: "Anxiety management"
5. Submit

Expected Results:
✓ Notification appears on mobile
✓ Web support worker "Jane Doe" sees appointment in their calendar
✓ Fields match: date, time, client name, type
✓ Can click to view/edit appointment
```

### Test Scenario 2: Web Support Worker Creates Appointment

```
1. Log in to web as support worker
2. Navigate to "Add Appointment" modal
3. Select client: "Alex Smith"
4. Set date: 2024-01-16, time: 10:00
5. Type: video, Notes: "Initial assessment"
6. Auto-assign support worker: checked
7. Submit

Expected Results:
✓ Appointment created
✓ Client "Alex Smith" sees appointment in mobile app
✓ Mobile shows worker name, date/time, type
✓ Can view meeting link if set
```

### Test Scenario 3: Availability Blocking

```
1. Set support worker "John" availability:
   - Monday to Friday: 9:00-17:00
   - Saturday, Sunday: disabled
2. Web: Try to create appointment on Saturday
3. Mobile: Try to create appointment on Sunday

Expected Behavior:
✓ Both systems log warning about worker unavailability
✓ Appointment still creates (current policy)
✓ Future: Could set status="pending_approval" instead
```

## Implementation Details

### Changes to Web (`convex/appointments.ts`)

**Enhanced `create` mutation:**
- Added `supportWorkerName` and `supportWorkerAvatar` optional parameters
- Fetches worker details from users table by clerkId
- Stores appointment in both web and mobile field formats
- Includes availability checking logic

**Key additions:**
```typescript
// Store worker details for mobile display
supportWorker: supportWorkerName,
avatarUrl: supportWorkerAvatar,

// Store both field formats
date: appointmentDate,
time: appointmentTime,

// Mobile compatibility field
userId: clientId,
```

### Changes to Mobile (`convex/appointments.ts`)

**Enhanced `createAppointment` mutation:**
- Changed `supportWorkerId` from number to string (Clerk ID)
- Added `orgId` parameter for web sync
- Looks up Clerk ID if worker name provided
- Checks worker availability before creating
- Stores appointment in both field formats

**Key additions:**
```typescript
// Resolve worker by name if Clerk ID not provided
const worker = await ctx.db
  .query("users")
  .withIndex("by_firstName", q => q.eq("firstName", args.supportWorker))
  .first();

// Check availability
if (!daySlot?.enabled) {
  console.warn(`Worker not available on ${dayOfWeek}`);
}

// Store both formats
appointmentDate: args.date,
appointmentTime: args.time,
clientId: args.userId,
```

## Future Enhancements

1. **Strict Availability Enforcement**: Set appointments to "pending_approval" status when scheduled outside worker hours instead of just logging warnings

2. **Time Range Checking**: Validate not just day-of-week but also time falls within startTime/endTime

3. **Conflict Detection**: Check for overlapping appointments in worker's calendar

4. **Rescheduling Sync**: Both platforms can reschedule; changes sync bidirectionally

5. **Cancellation Sync**: Cancellations from either platform appear immediately

6. **Attendee Notifications**: Send notifications to both client and worker when appointment is created, rescheduled, or cancelled

7. **Calendar Integration**: Sync with Google Calendar, Outlook, iCal

8. **Recurring Appointments**: Support series of appointments with rules

## Troubleshooting

### Appointment Created on Mobile but Not Visible on Web

1. Check `orgId` parameter was passed to `createAppointment`
2. Verify support worker Clerk ID is correct (check `supportWorkerId` field)
3. Ensure client's Clerk ID matches the `userId` field
4. Check org filtering in web appointment query

### Appointment Created on Web but Not Visible on Mobile

1. Verify `clientId` field matches client's `userId` (Clerk ID)
2. Check mobile is querying with correct `userId` parameter
3. Ensure appointment `status` is "scheduled" or "confirmed"
4. Check date is not in the past (mobile filters by `getUpcomingAppointments`)

### Availability Check Not Working

1. Verify support worker has `availability` array in users table
2. Check `availability[].day` is lowercase and matches JavaScript `toLocaleDateString` output
3. Verify `enabled` field is boolean true/false
4. Note: System currently only logs warnings, doesn't block creation

### Appointments Duplicated

1. Check API isn't being called multiple times (debounce form submissions)
2. Verify mutation isn't being retried due to network errors
3. Check ConvexDB transaction handling

## Related Documentation

- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Overall system architecture
- [CONVEX_MIGRATION_COMPLETE.md](./CONVEX_MIGRATION_COMPLETE.md) - Convex integration details
- [MOBILE_MIGRATION_PLAN.md](./MOBILE_MIGRATION_PLAN.md) - Mobile app structure
