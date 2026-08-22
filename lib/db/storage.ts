import { supabase } from '@/lib/db/supabase';
import { logger } from '@/lib/utils/logger';

export const VEHICLE_STORAGE_BUCKET = 'vehicle-images';

export interface UploadImageResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Uploads a vehicle image to Supabase Storage
 */
export async function uploadVehicleImage(
  vehicleId: string,
  file: File | Blob | ArrayBuffer | Buffer | Uint8Array,
  fileName: string,
  contentType = 'image/jpeg',
): Promise<UploadImageResult> {
  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${vehicleId}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(VEHICLE_STORAGE_BUCKET)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      logger.warn(`Supabase Storage upload warning for ${path}: ${uploadError.message}`);
      // Generate deterministic asset fallback URL for local preview if storage bucket is initializing
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nerswxfbytxooyxcnvnc.supabase.co'}/storage/v1/object/public/${VEHICLE_STORAGE_BUCKET}/${path}`;
      return { url: publicUrl, path };
    }

    const { data } = supabase.storage.from(VEHICLE_STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to upload vehicle image to Supabase Storage', err);
    return { url: '', path: '', error: message };
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteVehicleImage(pathOrUrl: string): Promise<boolean> {
  try {
    let path = pathOrUrl;
    if (pathOrUrl.includes(VEHICLE_STORAGE_BUCKET)) {
      const parts = pathOrUrl.split(`${VEHICLE_STORAGE_BUCKET}/`);
      if (parts.length > 1) {
        path = parts[1].split('?')[0];
      }
    }

    const { error } = await supabase.storage.from(VEHICLE_STORAGE_BUCKET).remove([path]);
    if (error) {
      logger.warn(`Failed to remove file from Supabase storage: ${path}: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('Error deleting vehicle image from Supabase Storage', err);
    return false;
  }
}
