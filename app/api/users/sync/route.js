import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

async function getConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  return client;
}

/**
 * GET /api/users/sync
 * Sync current Clerk user to Convex database
 * This ensures the user exists in Convex with proper orgId and roleId
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const convex = await getConvexClient();

    // Check if user exists in Convex
    let convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    console.log("Current Convex user:", convexUser);

    // Get role from Clerk metadata
    const role = user.publicMetadata?.role || 'support_worker';
    const roleId = role.replace(/-/g, '_');

    // Default org - using 'safespace' as the default organization
    // In production, you'd assign users to specific orgs during signup
    const defaultOrgId = 'safespace';

    if (!convexUser) {
      console.log("User not found in Convex, creating...");
      
      // Create user in Convex
      const emailAddress = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
      const email = emailAddress?.emailAddress;

      // Use syncSelf mutation which doesn't require admin permissions
      const userId = await convex.mutation(api.users.syncSelf, {
        clerkId: userId,
        email: email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        roleId: roleId,
        orgId: defaultOrgId,
        profileImageUrl: user.imageUrl,
      });

      console.log("✅ User created in Convex with ID:", userId);

      // Fetch the newly created user
      convexUser = await convex.query(api.users.getByClerkId, {
        clerkId: userId,
      });
    } else {
      console.log("User already exists in Convex");
      
      // Update user if orgId or roleId is missing using syncSelf
      if (!convexUser.orgId || !convexUser.roleId) {
        console.log("Updating user with missing orgId/roleId...");
        
        const emailAddress = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
        const email = emailAddress?.emailAddress;

        await convex.mutation(api.users.syncSelf, {
          clerkId: userId,
          email: email || convexUser.email || "",
          firstName: user.firstName || convexUser.firstName || "",
          lastName: user.lastName || convexUser.lastName || "",
          roleId: convexUser.roleId || roleId,
          orgId: convexUser.orgId || defaultOrgId,
          profileImageUrl: user.imageUrl || convexUser.profileImageUrl,
        });

        // Fetch updated user
        convexUser = await convex.query(api.users.getByClerkId, {
          clerkId: userId,
        });

        console.log("✅ User updated in Convex:", convexUser);
      }
    }

    return NextResponse.json({
      success: true,
      user: convexUser,
      message: "User synced successfully"
    });

  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 }
    );
  }
}
