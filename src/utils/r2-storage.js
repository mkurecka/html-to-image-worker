/**
 * R2 Storage utilities for image storage
 */

/**
 * Generates a unique filename for the image
 * @param {string} format - Image format (png, jpeg)
 * @param {string} prefix - Optional prefix for filename
 * @returns {string} Unique filename
 */
export function generateImageFilename(format = 'png', prefix = 'image') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${timestamp}-${randomId}.${format}`;
}

/**
 * Uploads image buffer to R2 storage
 * @param {R2Bucket} bucket - R2 bucket instance
 * @param {ArrayBuffer} imageBuffer - Image data
 * @param {string} filename - Target filename
 * @param {string} format - Image format
 * @returns {Promise<string>} Uploaded file key
 */
export async function uploadImageToR2(bucket, imageBuffer, filename, format = 'png') {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  
  const object = await bucket.put(filename, imageBuffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      generatedBy: 'html-to-image-worker',
      format: format
    }
  });

  if (!object) {
    throw new Error('Failed to upload image to R2 storage');
  }

  return filename;
}

/**
 * Generates public URL for R2 object
 * @param {string} bucketName - R2 bucket name
 * @param {string} filename - Object key/filename
 * @param {string} customDomain - Optional custom domain (should be full R2 public URL)
 * @returns {string} Public URL
 */
export function generateR2PublicUrl(bucketName, filename, customDomain = null) {
  if (customDomain && customDomain !== 'your-domain.com') {
    return `https://${customDomain}/${filename}`;
  }
  
  // Fallback to default format if no custom domain
  return `https://pub-${bucketName}.r2.dev/${filename}`;
}

/**
 * Deletes an image from R2 storage
 * @param {R2Bucket} bucket - R2 bucket instance
 * @param {string} filename - File to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImageFromR2(bucket, filename) {
  try {
    await bucket.delete(filename);
    return true;
  } catch (error) {
    console.error('Failed to delete image from R2:', error);
    return false;
  }
}

/**
 * Gets image metadata from R2
 * @param {R2Bucket} bucket - R2 bucket instance
 * @param {string} filename - File to check
 * @returns {Promise<Object|null>} File metadata or null if not found
 */
export async function getImageMetadata(bucket, filename) {
  try {
    const object = await bucket.head(filename);
    return object ? {
      size: object.size,
      etag: object.etag,
      uploaded: object.uploaded,
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata
    } : null;
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    return null;
  }
}

/**
 * Lists recent images from bucket
 * @param {R2Bucket} bucket - R2 bucket instance
 * @param {number} limit - Maximum number of objects to return
 * @param {string} prefix - Optional prefix filter
 * @returns {Promise<Array>} List of image objects
 */
export async function listRecentImages(bucket, limit = 10, prefix = '') {
  try {
    const objects = await bucket.list({
      limit,
      prefix,
      include: ['httpMetadata', 'customMetadata']
    });

    return objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      etag: obj.etag,
      metadata: obj.customMetadata
    }));
  } catch (error) {
    console.error('Failed to list images:', error);
    return [];
  }
}

/**
 * Validates R2 bucket configuration
 * @param {R2Bucket} bucket - R2 bucket instance
 * @returns {Promise<boolean>} Whether bucket is accessible
 */
export async function validateR2Bucket(bucket) {
  try {
    // Try to list objects to verify access
    await bucket.list({ limit: 1 });
    return true;
  } catch (error) {
    console.error('R2 bucket validation failed:', error);
    return false;
  }
}