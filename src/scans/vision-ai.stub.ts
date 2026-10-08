import { VisionAnalysis } from './dto/scan.dto';

// STUB — Layer 3 (Vision AI) is not wired up to a real hosted VLM yet.
// This returns a plausible, clearly-labeled placeholder so the rest of
// the coaching loop (training priority biasing, LLM coach context) can
// be built and tested end-to-end before the real API integration lands.
//
// Swap this out for a real call (e.g. GPT-4.1-class VLM) later: send the
// 4 standardized angle images, request this exact JSON shape back, and
// validate the response against the VisionAnalysis contract before
// persisting it — never trust the model's JSON without validation.
export const VISION_STUB_MODEL_VERSION = 'stub-v1-not-real-ai';

export function generateStubVisionAnalysis(): VisionAnalysis {
  return {
    body_composition: {
      body_fat_range_pct: [18, 23],
      confidence: 'low',
      notes:
        'Placeholder analysis — Vision AI (Layer 3) is not yet connected. This is not a real assessment.',
    },
    muscle_development: {
      overall_level: 'beginner',
      by_group: {
        chest: 'proportional',
        back: 'proportional',
        shoulders: 'underdeveloped',
        arms: 'proportional',
        legs: 'proportional',
        core: 'underdeveloped',
      },
    },
    symmetry: {
      left_right_balance: 'balanced',
      notes: 'Placeholder — no real symmetry analysis performed.',
    },
    priorities: ['shoulders', 'core'],
  };
}
