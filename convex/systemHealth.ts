import { query } from "./_generated/server";

/**
 * Get overall system health status
 * Monitors database connectivity, query performance, and system metrics
 */
export const getHealthStatus = query({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();

    try {
      // Test database connectivity by querying users table
      const testQuery = await ctx.db.query("users").take(1);
      const dbLatency = Date.now() - startTime;

      // Check if we can perform basic operations
      const isHealthy = dbLatency < 1000; // Healthy if query takes less than 1 second

      return {
        status: isHealthy ? "healthy" : "degraded",
        database: {
          connected: true,
          latency: dbLatency,
          status: dbLatency < 500 ? "excellent" : dbLatency < 1000 ? "good" : "slow",
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        },
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Get database statistics
 * Returns record counts for all major tables
 */
export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();

    // Count records in each table
    const [
      usersCount,
      organizationsCount,
      rolesCount,
      clientsCount,
      appointmentsCount,
      referralsCount,
      notesCount,
      auditLogsCount,
      crisisEventsCount,
    ] = await Promise.all([
      ctx.db.query("users").collect().then((r) => r.length),
      ctx.db.query("organizations").collect().then((r) => r.length),
      ctx.db.query("roles").collect().then((r) => r.length),
      ctx.db.query("clients").collect().then((r) => r.length),
      ctx.db.query("appointments").collect().then((r) => r.length),
      ctx.db.query("referrals").collect().then((r) => r.length),
      ctx.db.query("notes").collect().then((r) => r.length),
      ctx.db.query("auditLogs").collect().then((r) => r.length),
      ctx.db.query("crisisEvents").collect().then((r) => r.length),
    ]);

    const queryTime = Date.now() - startTime;

    return {
      tables: {
        users: usersCount,
        organizations: organizationsCount,
        roles: rolesCount,
        clients: clientsCount,
        appointments: appointmentsCount,
        referrals: referralsCount,
        notes: notesCount,
        auditLogs: auditLogsCount,
        crisisEvents: crisisEventsCount,
      },
      totalRecords:
        usersCount +
        organizationsCount +
        rolesCount +
        clientsCount +
        appointmentsCount +
        referralsCount +
        notesCount +
        auditLogsCount +
        crisisEventsCount,
      queryTime,
      timestamp: Date.now(),
    };
  },
});

/**
 * Get recent errors from audit logs
 * Identifies failed operations and system errors
 */
export const getRecentErrors = query({
  args: {},
  handler: async (ctx) => {
    // Get audit logs with error-related actions
    const allLogs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(1000);

    // Filter for error-related actions
    const errorLogs = allLogs.filter(
      (log) =>
        log.action.includes("error") ||
        log.action.includes("failed") ||
        log.action.includes("reject")
    );

    // Enrich with user names
    const enrichedErrors = await Promise.all(
      errorLogs.slice(0, 20).map(async (log) => {
        let userName = "System";
        if (log.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", log.userId))
            .first();
          if (user) {
            userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown User";
          }
        }
        return {
          ...log,
          userName,
        };
      })
    );

    return {
      totalErrors: errorLogs.length,
      recentErrors: enrichedErrors,
      timestamp: Date.now(),
    };
  },
});

/**
 * Get query performance metrics
 * Analyzes recent database operations for performance insights
 */
export const getPerformanceMetrics = query({
  args: {},
  handler: async (ctx) => {
    const metrics: Array<{ query: string; duration: number }> = [];

    // Test common query patterns
    const tests = [
      { name: "users_full_scan", test: async () => ctx.db.query("users").take(10) },
      { name: "organizations_list", test: async () => ctx.db.query("organizations").take(10) },
      { name: "audit_logs_recent", test: async () => ctx.db.query("auditLogs").order("desc").take(10) },
      { name: "appointments_list", test: async () => ctx.db.query("appointments").take(10) },
    ];

    for (const test of tests) {
      const start = Date.now();
      await test.test();
      const duration = Date.now() - start;
      metrics.push({ query: test.name, duration });
    }

    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

    return {
      metrics,
      averageQueryTime: avgDuration,
      status: avgDuration < 100 ? "excellent" : avgDuration < 300 ? "good" : "slow",
      timestamp: Date.now(),
    };
  },
});

/**
 * Get organization health metrics
 * Shows active users, recent activity by organization
 */
export const getOrganizationMetrics = query({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").collect();
    const users = await ctx.db.query("users").collect();

    // Count users per organization
    const orgMetrics = await Promise.all(
      organizations.map(async (org) => {
        const orgUsers = users.filter((u) => u.orgId === org._id);
        const activeUsers = orgUsers.filter((u) => u.status === "active");

        // Get recent audit logs for this org
        const recentActivity = await ctx.db
          .query("auditLogs")
          .withIndex("by_orgId", (q) => q.eq("orgId", org._id))
          .order("desc")
          .take(10);

        return {
          orgId: org._id,
          orgName: org.name,
          totalUsers: orgUsers.length,
          activeUsers: activeUsers.length,
          recentActivityCount: recentActivity.length,
          status: org.status,
        };
      })
    );

    return {
      organizations: orgMetrics,
      totalOrganizations: organizations.length,
      activeOrganizations: organizations.filter((o) => o.status === "active").length,
      timestamp: Date.now(),
    };
  },
});
