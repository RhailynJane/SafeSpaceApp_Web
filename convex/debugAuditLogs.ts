/**
 * Debug helper to check audit logs
 */

import { query } from "./_generated/server";

export const getAllAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLogs").order("desc").take(100);
    
    // Group by action type
    const byAction = logs.reduce((acc: any, log) => {
      if (!acc[log.action]) acc[log.action] = [];
      acc[log.action].push(log);
      return acc;
    }, {});
    
    return {
      total: logs.length,
      byAction: Object.keys(byAction).map(action => ({
        action,
        count: byAction[action].length,
        latest: byAction[action][0]?.timestamp
      })),
      recentLogs: logs.slice(0, 10).map(log => ({
        action: log.action,
        entityType: log.entityType,
        timestamp: log.timestamp,
        userId: log.userId,
        orgId: log.orgId
      }))
    };
  },
});
