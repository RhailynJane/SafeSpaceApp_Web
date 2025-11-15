/**
 * Seed initial data for SafeSpace
 * This should be run once to populate initial organizations, roles, and superadmin user
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed initial organizations and roles
 * This mutation should be called manually via Convex dashboard or CLI
 */
export const seedInitialData = mutation({
  args: {
    superadminEmail: v.string(),
    superadminClerkId: v.string(),
    superadminFirstName: v.string(),
    superadminLastName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🌱 Starting seed process...");

    // ============================================
    // 1. Create Roles
    // ============================================
    console.log("📋 Creating roles...");
    
    const roles = [
      {
        slug: "superadmin",
        name: "SuperAdmin",
        description: "System-wide administrator with full access to all organizations and settings",
        permissions: [
          "manage_organizations",
          "view_all_organizations",
          "manage_all_users",
          "manage_org_users",
          "view_users",
          "create_users",
          "manage_clients",
          "view_clients",
          "assign_clients",
          "manage_notes",
          "view_notes",
          "manage_appointments",
          "view_appointments",
          "manage_referrals",
          "view_referrals",
          "process_referrals",
          "manage_crisis_events",
          "view_crisis_events",
          "view_audit_logs",
          "view_system_alerts",
          "manage_system_alerts",
          "view_reports",
          "generate_reports",
        ],
        level: 0,
      },
      {
        slug: "admin",
        name: "Administrator",
        description: "Organization administrator with full access within their organization",
        permissions: [
          "manage_org_users",
          "view_users",
          "create_users",
          "manage_clients",
          "view_clients",
          "assign_clients",
          "manage_notes",
          "view_notes",
          "manage_appointments",
          "view_appointments",
          "manage_referrals",
          "view_referrals",
          "process_referrals",
          "manage_crisis_events",
          "view_crisis_events",
          "view_audit_logs",
          "view_system_alerts",
          "view_reports",
          "generate_reports",
        ],
        level: 1,
      },
      {
        slug: "team_leader",
        name: "Team Leader",
        description: "Team leader with client assignment and oversight within their organization",
        permissions: [
          "view_users",
          "manage_clients",
          "view_clients",
          "assign_clients",
          "manage_notes",
          "view_notes",
          "manage_appointments",
          "view_appointments",
          "view_referrals",
          "process_referrals",
          "manage_crisis_events",
          "view_crisis_events",
          "view_reports",
        ],
        level: 2,
      },
      {
        slug: "support_worker",
        name: "Support Worker (CMHA)",
        description: "Support worker with limited clinical access",
        permissions: [
          "view_users",
          "view_clients",
          "manage_notes",
          "view_notes",
          "manage_appointments",
          "view_appointments",
          "view_referrals",
          "manage_crisis_events",
          "view_crisis_events",
        ],
        level: 3,
      },
      {
        slug: "peer_support",
        name: "Peer Support (SAIT)",
        description: "Peer support with limited clinical access (same as Support Worker)",
        permissions: [
          "view_users",
          "view_clients",
          "manage_notes",
          "view_notes",
          "manage_appointments",
          "view_appointments",
          "view_referrals",
          "manage_crisis_events",
          "view_crisis_events",
        ],
        level: 3,
      },
      {
        slug: "client",
        name: "Client",
        description: "Client user with access to personal features only",
        permissions: [],
        level: 4,
      },
    ];

    for (const roleData of roles) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_slug", (q) => q.eq("slug", roleData.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("roles", {
          ...roleData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`  ✅ Created role: ${roleData.name}`);
      } else {
        console.log(`  ⏭️  Role already exists: ${roleData.name}`);
      }
    }

    // ============================================
    // 2. Create Organizations
    // ============================================
    console.log("🏢 Creating organizations...");
    
    const organizations = [
            {
              name: "SafeSpace",
              slug: "safespace",
              description: "SafeSpace Development Team - System Organization (Hidden)",
              contactEmail: "safespace.dev.app@gmail.com",
              status: "active" as const,
            },
      {
        name: "CMHA Calgary",
        slug: "cmha-calgary",
        description: "Canadian Mental Health Association - Calgary Region",
        contactEmail: "info@cmha.calgary.ab.ca",
        contactPhone: "+1 (403) 297-1700",
        website: "https://www.cmha.calgary.ab.ca",
        status: "active" as const,
      },
      {
        name: "SAIT",
        slug: "sait",
        description: "Southern Alberta Institute of Technology",
        contactEmail: "info@sait.ca",
        contactPhone: "+1 (403) 284-8110",
        website: "https://www.sait.ca",
        status: "active" as const,
      },
      {
        name: "Unaffiliated",
        slug: "unaffiliated",
        description: "Independent users not affiliated with any specific organization",
        status: "active" as const,
      },
    ];

    for (const orgData of organizations) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", orgData.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("organizations", {
          ...orgData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`  ✅ Created organization: ${orgData.name}`);
      } else {
        console.log(`  ⏭️  Organization already exists: ${orgData.name}`);
      }
    }

    // ============================================
    // 3. Create SuperAdmin User
    // ============================================
    console.log("👤 Creating SuperAdmin user...");
    
    const existingSuperAdmin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.superadminClerkId))
      .first();

    if (!existingSuperAdmin) {
      await ctx.db.insert("users", {
        clerkId: args.superadminClerkId,
        email: args.superadminEmail,
        firstName: args.superadminFirstName,
        lastName: args.superadminLastName,
        roleId: "superadmin",
          orgId: "safespace",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`  ✅ Created SuperAdmin: ${args.superadminEmail}`);
    } else {
      console.log(`  ⏭️  SuperAdmin already exists: ${args.superadminEmail}`);
    }

    // ============================================
    // 4. Create initial audit log
    // ============================================
    await ctx.db.insert("auditLogs", {
      userId: args.superadminClerkId,
      action: "initial_seed_completed",
      entityType: "system",
      details: JSON.stringify({
        rolesCreated: roles.length,
        organizationsCreated: organizations.length,
      }),
      timestamp: Date.now(),
    });

    console.log("✅ Seed process completed successfully!");
    
    return {
      success: true,
      message: "Initial data seeded successfully",
      summary: {
        roles: roles.length,
        organizations: organizations.length,
        superadminCreated: !existingSuperAdmin,
      },
    };
  },
});
