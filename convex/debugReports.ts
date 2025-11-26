import { query } from "./_generated/server";
import { v } from "convex/values";

export const listAllReports = query({
  args: {},
  handler: async (ctx) => {
    console.log("[DEBUG REPORTS] Starting debug query...");
    
    // Get all reports without filtering
    const allReports = await ctx.db.query("reports").collect();
    console.log("[DEBUG REPORTS] Total reports in database:", allReports.length);
    
    // Show sample reports
    if (allReports.length > 0) {
      console.log("[DEBUG REPORTS] Sample report:", allReports[0]);
      
      // Group by orgId
      const byOrg = {};
      allReports.forEach(report => {
        const org = report.orgId || 'unknown';
        byOrg[org] = (byOrg[org] || 0) + 1;
      });
      console.log("[DEBUG REPORTS] Reports by orgId:", byOrg);
      
      // Group by reportType
      const byType = {};
      allReports.forEach(report => {
        const type = report.reportType || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      console.log("[DEBUG REPORTS] Reports by type:", byType);
    }
    
    return {
      totalCount: allReports.length,
      reports: allReports.slice(0, 5), // Return first 5 for inspection
      summary: {
        byOrg: allReports.reduce((acc, r) => {
          const org = r.orgId || 'unknown';
          acc[org] = (acc[org] || 0) + 1;
          return acc;
        }, {}),
        byType: allReports.reduce((acc, r) => {
          const type = r.reportType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  },
});

export const checkSpecificOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    console.log("[DEBUG REPORTS] Checking org:", args.orgId);
    
    const orgReports = await ctx.db
      .query("reports")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .collect();
      
    console.log("[DEBUG REPORTS] Reports for org", args.orgId, ":", orgReports.length);
    
    if (orgReports.length > 0) {
      console.log("[DEBUG REPORTS] Latest report:", orgReports[orgReports.length - 1]);
    }
    
    return {
      orgId: args.orgId,
      count: orgReports.length,
      reports: orgReports.map(r => ({
        _id: r._id,
        title: r.title,
        reportType: r.reportType,
        createdAt: r.createdAt,
        createdBy: r.createdBy
      }))
    };
  },
});