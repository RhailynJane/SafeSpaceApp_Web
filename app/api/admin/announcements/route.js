import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/convex-mobile/_generated/api';
import sharp from 'sharp';

// Helper to get user's organization
async function getUserOrg(userId) {
  const user = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
  return user?.orgId || 'cmha-calgary';
}

// Compress and convert image to base64 data URL
async function compressImage(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Compress image to max 800px width/height, 80% quality, webp format
  const compressed = await sharp(buffer)
    .resize(800, 800, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: 80 })
    .toBuffer();
  
  // Convert to base64 data URL
  const base64 = compressed.toString('base64');
  return `data:image/webp;base64,${base64}`;
}

/**
 * GET /api/admin/announcements
 * List all announcements for CMHA Calgary organization only
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always fetch from CMHA Calgary
    const orgId = 'cmha-calgary';
    
    const result = await fetchQuery(api.announcements.listByOrg, {
      orgId,
      activeOnly: false,
      limit: 100
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 * Create a new announcement for CMHA Calgary with optional images
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always use CMHA Calgary
    const orgId = 'cmha-calgary';
    const formData = await request.formData();
    
    const title = formData.get('title');
    const body = formData.get('body');
    const active = formData.get('active') === 'true';
    const imageFiles = formData.getAll('images');

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Process and compress images
    const images = [];
    for (const file of imageFiles.slice(0, 3)) {
      if (file && file.size > 0) {
        try {
          const compressed = await compressImage(file);
          images.push(compressed);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Continue with other images if one fails
        }
      }
    }

    const result = await fetchMutation(api.announcementActions.createAnnouncementWithImages, {
      orgId,
      title,
      body,
      active,
      images
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
