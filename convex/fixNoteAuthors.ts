import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Utility to fix existing notes that have missing or incorrect author information
 * This can be run to retroactively update notes created before the staff selector was implemented
 */
export const fixNoteAuthors = mutation({
  args: {
    clerkId: v.string(), // Admin user running the fix
    defaultAuthorUserId: v.optional(v.string()), // Default author to assign to notes with missing authors
  },
  handler: async (ctx, args) => {
    console.log("🔧 Starting note author fix...");
    
    // Get all notes
    const allNotes = await ctx.db.query("notes").collect();
    console.log(`📝 Found ${allNotes.length} total notes`);
    
    // Get all users to help with mapping
    const allUsers = await ctx.db.query("users").collect();
    console.log(`👥 Found ${allUsers.length} users for mapping`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const note of allNotes) {
      try {
        let needsUpdate = false;
        let newAuthorUserId = note.authorUserId;
        
        // Check if author is missing or unknown
        if (!note.authorUserId) {
          console.log(`❌ Note ${note._id} has no authorUserId`);
          newAuthorUserId = args.defaultAuthorUserId || args.clerkId;
          needsUpdate = true;
        } else {
          // Check if authorUserId exists in users table
          const authorExists = allUsers.find(u => 
            u.clerkId === note.authorUserId || u._id === note.authorUserId
          );
          
          if (!authorExists) {
            console.log(`❓ Note ${note._id} has unknown author: ${note.authorUserId}`);
            newAuthorUserId = args.defaultAuthorUserId || args.clerkId;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await ctx.db.patch(note._id, {
            authorUserId: newAuthorUserId,
            updatedAt: Date.now(),
          });
          
          console.log(`✅ Fixed note ${note._id}: ${note.authorUserId} → ${newAuthorUserId}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`💥 Error fixing note ${note._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🏁 Note author fix complete: ${fixedCount} fixed, ${errorCount} errors`);
    
    return {
      totalNotes: allNotes.length,
      fixedCount,
      errorCount,
      message: `Fixed ${fixedCount} notes, ${errorCount} errors`
    };
  },
});

/**
 * Get summary of notes with author issues for debugging
 */
export const analyzeNoteAuthors = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const allNotes = await ctx.db.query("notes").collect();
    const allUsers = await ctx.db.query("users").collect();
    
    const analysis = {
      totalNotes: allNotes.length,
      totalUsers: allUsers.length,
      notesWithoutAuthor: 0,
      notesWithUnknownAuthor: 0,
      notesWithValidAuthor: 0,
      authorBreakdown: {} as Record<string, number>,
    };
    
    for (const note of allNotes) {
      if (!note.authorUserId) {
        analysis.notesWithoutAuthor++;
      } else {
        const authorExists = allUsers.find(u => 
          u.clerkId === note.authorUserId || u._id === note.authorUserId
        );
        
        if (authorExists) {
          analysis.notesWithValidAuthor++;
          const authorName = `${authorExists.firstName || ''} ${authorExists.lastName || ''}`.trim() || 'Unnamed User';
          analysis.authorBreakdown[authorName] = (analysis.authorBreakdown[authorName] || 0) + 1;
        } else {
          analysis.notesWithUnknownAuthor++;
          analysis.authorBreakdown[`Unknown (${note.authorUserId})`] = (analysis.authorBreakdown[`Unknown (${note.authorUserId})`] || 0) + 1;
        }
      }
    }
    
    console.log("📊 Note Author Analysis:", analysis);
    return analysis;
  },
});