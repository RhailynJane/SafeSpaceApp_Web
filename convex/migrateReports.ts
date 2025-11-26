import { mutation, query } from "./_generated/server";

/**
 * Fix existing reports by adding orgId field
 * All existing reports were created by user_35acMY1UgRxVRWZ7cbme9gtqKNA 
 * who belongs to cmha-calgary organization
 */
export const fixReportsOrgId = mutation({
  args: {},
  handler: async (ctx) => {
    const allReports = await ctx.db.query("reports").collect();
    console.log(`Found ${allReports.length} reports to potentially fix`);
    
    let fixedCount = 0;
    
    for (const report of allReports) {
      // If report has no orgId or undefined orgId, set it to cmha-calgary
      if (!report.orgId || report.orgId === undefined || report.orgId === null) {
        await ctx.db.patch(report._id, {
          orgId: "cmha-calgary"
        });
        fixedCount++;
        console.log(`Fixed report ${report._id}: ${report.title} - set orgId to cmha-calgary`);
      }
    }
    
    console.log(`Migration complete: Fixed ${fixedCount} reports`);
    return { 
      totalReports: allReports.length,
      fixedReports: fixedCount,
      message: `Fixed ${fixedCount} out of ${allReports.length} reports` 
    };
  }
});

/**
 * Check which reports need fixing
 */
export const checkReportsOrgId = query({
  args: {},
  handler: async (ctx) => {
    const allReports = await ctx.db.query("reports").collect();
    
    const noOrgId = allReports.filter(r => !r.orgId || r.orgId === undefined || r.orgId === null);
    const withOrgId = allReports.filter(r => r.orgId && r.orgId !== undefined && r.orgId !== null);
    
    console.log(`Total reports: ${allReports.length}`);
    console.log(`Reports without orgId: ${noOrgId.length}`);
    console.log(`Reports with orgId: ${withOrgId.length}`);
    
    return {
      total: allReports.length,
      needsFixing: noOrgId.length,
      alreadyFixed: withOrgId.length,
      sampleWithoutOrgId: noOrgId.slice(0, 3).map(r => ({ 
        id: r._id, 
        title: r.title, 
        createdBy: r.createdBy,
        orgId: r.orgId
      })),
      sampleWithOrgId: withOrgId.slice(0, 3).map(r => ({ 
        id: r._id, 
        title: r.title, 
        createdBy: r.createdBy,
        orgId: r.orgId
      }))
    };
  }
});