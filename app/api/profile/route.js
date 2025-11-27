
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    // Map Convex fields to expected format
    const profileData = {
      ...localUser,
      first_name: localUser.firstName,
      last_name: localUser.lastName,
      phone: localUser.phoneNumber,
      profile_image_url: localUser.profileImageUrl || localUser.imageUrl,
      role: localUser.roleId,
      created_at: localUser.createdAt,
    };

    return NextResponse.json(profileData);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    const data = await req.json();

    // Validate phone number before sending to Convex
    if (data.phone) {
      const phone = data.phone.trim();
      if (phone) {
        const phoneRegex = /^[\d\s()+-]+$/;
        if (!phoneRegex.test(phone)) {
          return NextResponse.json({ error: "Invalid phone number format (use only digits, spaces, +, -, ( ))" }, { status: 400 });
        }
        if (phone.length > 20) {
          return NextResponse.json({ error: "Phone number too long (max 20 characters)" }, { status: 400 });
        }
      }
    }

    try {
      await fetchMutation(api.users.update, {
        clerkId: user.id,
        targetClerkId: user.id,
        firstName: data.first_name?.trim(),
        lastName: data.last_name?.trim(),
        phoneNumber: data.phone?.trim() || undefined,
        profileImageUrl: data.profile_image_url?.trim(),
      });
    } catch (convexError) {
      // Catch Convex validation errors and return them cleanly
      const errorMessage = convexError.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Fetch the updated user to return
    const updatedUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    // Map to expected format
    const profileData = {
      ...updatedUser,
      first_name: updatedUser.firstName,
      last_name: updatedUser.lastName,
      phone: updatedUser.phoneNumber,
      profile_image_url: updatedUser.profileImageUrl || updatedUser.imageUrl,
      role: updatedUser.roleId,
      created_at: updatedUser.createdAt,
    };

    return NextResponse.json(profileData);
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    // Return the actual error message from Convex validation
    const errorMessage = err.message || "Failed to update profile";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
