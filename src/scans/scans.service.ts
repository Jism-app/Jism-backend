import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { ScanAngle, ScanResponse, SCAN_ANGLES } from './dto/scan.dto';
import { generateStubVisionAnalysis, VISION_STUB_MODEL_VERSION } from './vision-ai.stub';

export const SCANS_BUCKET = 'body-scans';

export interface UploadedAngleFile {
  angle: ScanAngle;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

  constructor(@Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient) {}

  async createScan(userId: string, files: UploadedAngleFile[]): Promise<ScanResponse> {
    const missing = SCAN_ANGLES.filter((a) => !files.some((f) => f.angle === a));
    if (missing.length > 0) {
      throw new Error(`Missing required scan angles: ${missing.join(', ')}`);
    }

    const scanId = randomUUID();

    // 1. Insert a 'pending' row first so we have a stable id to upload under
    // and so a failure mid-upload leaves an inspectable 'pending' row rather
    // than nothing at all.
    const { error: insertError } = await this.supabase.from('body_scans').insert({
      id: scanId,
      user_id: userId,
      status: 'pending',
    });
    if (insertError) {
      throw new Error(`Failed to create scan record: ${insertError.message}`);
    }

    try {
      // 2. Upload all 4 angle images to Storage, scoped under the user's id
      // so Storage-level access can mirror the RLS pattern used everywhere
      // else (never trust a client-supplied path).
      const imageUrls: Record<ScanAngle, string> = {} as Record<ScanAngle, string>;
      for (const file of files) {
        const path = `${userId}/${scanId}/${file.angle}.jpg`;
        const { error: uploadError } = await this.supabase.storage
          .from(SCANS_BUCKET)
          .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
        if (uploadError) {
          throw new Error(`Failed to upload ${file.angle} image: ${uploadError.message}`);
        }
        imageUrls[file.angle] = path;
      }

      // 3. Mark processing, then run (stubbed) Vision AI analysis.
      await this.supabase
        .from('body_scans')
        .update({
          status: 'processing',
          front_image_url: imageUrls.front,
          left_image_url: imageUrls.left,
          right_image_url: imageUrls.right,
          back_image_url: imageUrls.back,
        })
        .eq('id', scanId);

      // STUB: real implementation calls the hosted Vision AI here with the
      // 4 uploaded images and validates the JSON shape before persisting.
      const visionAnalysis = generateStubVisionAnalysis();

      const { data: completed, error: completeError } = await this.supabase
        .from('body_scans')
        .update({
          status: 'completed',
          vision_analysis: visionAnalysis,
          vision_model_version: VISION_STUB_MODEL_VERSION,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId)
        .select()
        .single();

      if (completeError) {
        throw new Error(`Failed to finalize scan: ${completeError.message}`);
      }

      return completed as ScanResponse;
    } catch (err) {
      this.logger.error(`Scan ${scanId} failed`, err as Error);
      await this.supabase
        .from('body_scans')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        })
        .eq('id', scanId);
      throw err;
    }
  }

  async getScan(userId: string, scanId: string): Promise<ScanResponse> {
    const { data, error } = await this.supabase
      .from('body_scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Scan not found');
    }
    return data as ScanResponse;
  }

  async listScans(userId: string, limit: number): Promise<ScanResponse[]> {
    const { data, error } = await this.supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list scans: ${error.message}`);
    }
    return (data ?? []) as ScanResponse[];
  }

  // Signed URL so the mobile client can display a private Storage image
  // without the bucket being public.
  async getSignedImageUrl(userId: string, scanId: string, angle: ScanAngle): Promise<string> {
    const path = `${userId}/${scanId}/${angle}.jpg`;
    const { data, error } = await this.supabase.storage
      .from(SCANS_BUCKET)
      .createSignedUrl(path, 60 * 10); // 10 minutes

    if (error || !data) {
      throw new NotFoundException('Image not found');
    }
    return data.signedUrl;
  }
}
