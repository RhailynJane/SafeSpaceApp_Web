# Mobile App Convex Migration Plan

## Current Situation
- Mobile app uses `convex-mobile/` folder (currently deployed to cloud)
- Web app uses `convex/` folder (not yet deployed)
- **Both need to share the same Convex deployment**

## The Problem
When you run `npx convex dev`:
- ✅ It uploads files from `convex/` folder
- ❌ It **ignores** files from `convex-mobile/` folder
- ❌ This would **break** all mobile app functions

## The Solution

### Step 1: Consolidate Functions ✅ READY
**Move** all mobile functions from `convex-mobile/` to `convex/mobile/`:

```
convex-mobile/users.ts       → convex/mobile/users.ts
convex-mobile/auth.ts         → convex/mobile/auth.ts
convex-mobile/appointments.ts → convex/mobile/appointments.ts
... (all other .ts files)
```

**Keep** in `convex-mobile/`:
- `schema.ts` (for reference only)
- `_generated/` (auto-generated, can be deleted)

### Step 2: Update Mobile App Import Paths
Mobile app currently imports:
```typescript
import { api } from "@/convex-mobile/_generated/api";
```

After deployment, change to:
```typescript
import { api } from "@/convex/_generated/api";
```

Mobile functions will be at:
```typescript
// OLD path (won't work after migration)
api.users.syncUser

// NEW path (works after migration)
api.mobile.users.syncUser
```

### Step 3: Schema - Already Done ✅
`convex/schema.ts` already contains:
- ✅ All mobile tables (users, conversations, messages, moods, etc.)
- ✅ All web tables (organizations, roles, clients, referrals, etc.)
- ✅ Backward compatibility (mobile fields are preserved)

## Safety Checklist

### Before Running `npx convex dev`:
- [ ] All `convex-mobile/*.ts` files copied to `convex/mobile/`
- [ ] Schema compatibility verified (already done ✅)
- [ ] Mobile app code ready to update imports

### After Running `npx convex dev`:
- [ ] Update mobile app imports from `convex-mobile/_generated` to `convex/_generated`
- [ ] Update mobile function calls from `api.users.*` to `api.mobile.users.*`
- [ ] Test mobile app thoroughly

## Compatibility Guarantees

### Tables (Schema)
| Mobile Table | Status | Notes |
|-------------|--------|-------|
| users | ✅ Compatible | Web adds optional fields (roleId, status, etc.) |
| appointments | ✅ Compatible | Supports both mobile (userId, date, time) and web fields |
| conversations | ✅ Compatible | Web adds optional orgId |
| messages | ✅ Identical | No changes |
| moods | ✅ Identical | No changes |
| profiles | ✅ Compatible | Web has all mobile fields |
| All other mobile tables | ✅ Preserved | Copied to unified schema |

### Functions
All mobile functions will be available at `api.mobile.*` after migration.

## Rollback Plan
If anything breaks:
1. Stop `npx convex dev` (Ctrl+C)
2. Deploy old `convex-mobile/` schema:
   ```bash
   cd convex-mobile
   npx convex dev
   ```

## Next Steps (Your Decision)

**Option A: Safe Migration (Recommended)**
1. I copy all `convex-mobile/*.ts` to `convex/mobile/`
2. You review the changes
3. We run `npx convex dev` together
4. You update mobile app imports
5. Test both apps

**Option B: Test on Separate Convex Project First**
1. Create a new Convex project
2. Deploy unified schema there
3. Test mobile app against it
4. If successful, deploy to production

**Option C: Wait**
- Keep web and mobile separate for now
- Deploy web to a different Convex project
- Merge later when ready

---

**What would you like to do?** I recommend Option A, and I can help update the mobile app imports after deployment.
