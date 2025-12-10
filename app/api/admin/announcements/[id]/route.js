import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import sharp from 'sharp';

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
 * PUT /api/admin/announcements/[id]
 * Update an existing announcement
 */
export async function PUT(request, context) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Check if this is a simple JSON update (for toggle active) or multipart (for full edit)
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Simple JSON update (toggle active)
      const { title, body, active } = await request.json();
      
      const result = await fetchMutation(api.announcementActions.updateAnnouncement, {
        announcementId: id,
        title,
        body,
        active
      });

      return NextResponse.json(result);
    } else {
      // Multipart form data (full edit with images)
      const formData = await request.formData();
      
      const title = formData.get('title');
      const body = formData.get('body');
      const active = formData.get('active') === 'true';
      const imageFiles = formData.getAll('images');
      const existingImagesStr = formData.get('existingImages');

      if (!title || !body) {
        return NextResponse.json(
          { error: 'Title and body are required' },
          { status: 400 }
        );
      }

      // Start with existing images
      const images = existingImagesStr ? JSON.parse(existingImagesStr) : [];

      // Process and compress new images
      for (const file of imageFiles) {
        if (file && file.size > 0 && images.length < 3) {
          try {
            const compressed = await compressImage(file);
            images.push(compressed);
          } catch (error) {
            console.error('Error compressing image:', error);
          }
        }
      }

      const result = await fetchMutation(api.announcementActions.updateAnnouncement, {
        announcementId: id,
        title,
        body,
        active,
        images: images.slice(0, 3)
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Delete an announcement
 */
export async function DELETE(request, context) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const result = await fetchMutation(api.announcementActions.deleteAnnouncement, {
      announcementId: id
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
