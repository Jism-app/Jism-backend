import { z } from 'zod';

// Query params for GET /scans
export const listScansSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type ListScansQuery = z.infer<typeof listScansSchema>;

// The 4 standardized angles a scan requires. Matches body_scans columns
// front_image_url / left_image_url / right_image_url / back_image_url.
export const SCAN_ANGLES = ['front', 'left', 'right', 'back'] as const;
export type ScanAngle = (typeof SCAN_ANGLES)[number];

// Shape returned to the client. Mirrors the body_scans table.
export interface ScanResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  front_image_url: string | null;
  left_image_url: string | null;
  right_image_url: string | null;
  back_image_url: string | null;
  pose_scores: Record<string, number> | null;
  vision_analysis: VisionAnalysis | null;
  vision_model_version: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// Structured output contract for Layer 3 (Vision AI). The real
// implementation (a hosted VLM call) must return exactly this shape —
// the stub below exists so the rest of the stack (nutrition/training
// adjustment, LLM coach context) can be built against a stable contract
// before the real Vision AI integration lands.
//
// IMPORTANT: never return an exact body-fat percentage — always a range
// plus a confidence band. This is a product requirement, not a style
// choice: a false-precision number read as fact is worse than a range.
export interface VisionAnalysis {
  body_composition: {
    body_fat_range_pct: [number, number];
    confidence: 'low' | 'medium' | 'high';
    notes: string;
  };
  muscle_development: {
    overall_level: 'beginner' | 'intermediate' | 'advanced';
    by_group: Record<string, 'underdeveloped' | 'proportional' | 'well_developed'>;
  };
  symmetry: {
    left_right_balance: 'balanced' | 'minor_imbalance' | 'notable_imbalance';
    notes: string;
  };
  priorities: string[]; // muscle groups to bias training volume toward, ordered
}
