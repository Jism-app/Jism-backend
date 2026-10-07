import { z } from 'zod';

// Mirrors the CHECK constraints on the `profiles` table exactly. Keeping
// these in sync with physiqueai_schema.sql matters: a mismatch here means
// requests that pass validation still fail at the DB with a raw Postgres
// constraint error instead of a clean 400.

export const createProfileSchema = z.object({
  age: z.number().int().min(13).max(100),
  sex: z.enum(['male', 'female']),
  height_cm: z.number().min(50).max(250),
  weight_kg: z.number().min(20).max(300),
  goal: z.enum(['muscle_gain', 'fat_loss', 'recomposition', 'general_fitness']),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  training_days_per_week: z.number().int().min(2).max(6),
  equipment: z.array(z.string()).default([]),
  activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .default('moderate'),

  // Optional measurements — collected on an onboarding step the user can
  // skip, per the spec.
  waist_cm: z.number().positive().optional(),
  chest_cm: z.number().positive().optional(),
  arm_cm: z.number().positive().optional(),
  thigh_cm: z.number().positive().optional(),
  dietary_preferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
});

export type CreateProfileDto = z.infer<typeof createProfileSchema>;

// Partial update for an existing profile. Deliberately omits
// onboarding_completed — that flag is server-controlled (set to true only
// by the create flow) and must never be settable directly by the client,
// per the spec's explicit warning about this exact field.
export const updateProfileSchema = createProfileSchema.partial();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
