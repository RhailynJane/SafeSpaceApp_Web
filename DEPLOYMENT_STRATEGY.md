# Safe Deployment Strategy: New Convex Project

## Current State
- **Production deployment:** `dev:formal-pigeon-483` (mobile app using this)
- **Risk:** Any schema changes could break mobile app

## Safe Approach: Create New Deployment

### Step 1: Create New Convex Project
```powershell
cd C:\safespace-web\SafeSpaceApp
npx convex dev --project <new-project-name>
# This will create a completely separate deployment
```

### Step 2: Deploy Unified Schema
- New deployment gets `convex/schema.ts` (mobile + web tables)
- All functions from `convex/` folder
- Zero impact on production mobile app

### Step 3: Update Environment Variables
Create `.env.local.new`:
```env
# New Convex deployment URL
NEXT_PUBLIC_CONVEX_URL=https://new-deployment-name.convex.cloud

# Same Clerk (shared auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 4: Test Web App
- Run web app with new deployment
- Seed data: `npx convex run seed:seedInitialData`
- Test SuperAdmin, organizations, users, appointments

### Step 5: Point Mobile App to New Deployment (when ready)
Update mobile app's `.env`:
```env
# OLD (current production)
EXPO_PUBLIC_CONVEX_URL=https://formal-pigeon-483.convex.cloud

# NEW (tested and ready)
EXPO_PUBLIC_CONVEX_URL=https://new-deployment-name.convex.cloud
```

### Step 6: Migrate Data (if needed)
If you have existing mobile data in production:
1. Export from old deployment
2. Import to new deployment
3. Or run both in parallel during transition

## Advantages
- ✅ Mobile app continues working on old deployment
- ✅ Test everything thoroughly on new deployment
- ✅ Switch over when confident
- ✅ Easy rollback if issues found
- ✅ Can migrate gradually

## Disadvantages
- ⚠️ Two deployments temporarily (free tier allows this)
- ⚠️ Need to migrate existing mobile data
- ⚠️ Need to update mobile app's Convex URL eventually

## Recommendation
**Do this approach!** It's the safest way to merge web and mobile without risk.

---

## Quick Start Commands

**1. Create new deployment:**
```powershell
cd C:\safespace-web\SafeSpaceApp
npx convex dev --project safespace-unified
```

**2. Seed new deployment:**
```powershell
npx convex run seed:seedInitialData --superadminEmail "your@email.com" --superadminClerkId "user_xxx" --superadminFirstName "Your" --superadminLastName "Name"
```

**3. Run web app with new deployment:**
```powershell
# Update NEXT_PUBLIC_CONVEX_URL in .env.local first
npm run dev
```

**4. Test mobile app with new deployment:**
```env
# In mobile app's .env
EXPO_PUBLIC_CONVEX_URL=https://new-deployment-name.convex.cloud
```

---

**Ready to start?** Say yes and I'll help you create the new deployment!
