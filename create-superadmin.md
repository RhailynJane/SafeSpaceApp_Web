# Create SuperAdmin User

Your Clerk user exists but there's no corresponding user in the Convex database.

## Your Clerk Details:
- **Clerk ID**: `user_36UDKKVRjPuAQlr5vwrqXu31Pyc`
- **Email**: `safespace.dev.app@gmail.com`

## Steps to Create SuperAdmin:

### Option 1: Using Convex Dashboard (Recommended)

1. Open your Convex dashboard: https://dashboard.convex.dev/
2. Navigate to your deployment: `dev:wandering-partridge-43`
3. Go to "Functions" tab
4. Find and run `bootstrapSuperAdmin:createSuperAdmin`
5. Provide these arguments:
```json
{
  "clerkId": "user_36UDKKVRjPuAQlr5vwrqXu31Pyc",
  "email": "safespace.dev.app@gmail.com",
  "firstName": "SafeSpace",
  "lastName": "Admin"
}
```

### Option 2: Using Convex CLI

Run this command in your terminal:

```powershell
npx convex run bootstrapSuperAdmin:createSuperAdmin --arg clerkId "user_36UDKKVRjPuAQlr5vwrqXu31Pyc" --arg email "safespace.dev.app@gmail.com" --arg firstName "SafeSpace" --arg lastName "Admin"
```

## After Creation:

1. Refresh your browser at `localhost:3000/superadmin`
2. The "Verifying access..." should disappear
3. You should see the SuperAdmin dashboard

## Verification:

You can verify the user was created by running:
```powershell
npx convex run bootstrapSuperAdmin:showMyClerkId --arg clerkId "user_36UDKKVRjPuAQlr5vwrqXu31Pyc"
```

This should show `userExists: true` and `role: "superadmin"`.
