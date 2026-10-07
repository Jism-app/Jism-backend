import { ActivityLevel, Goal, NutritionInput, NutritionResult } from './nutrition.types';

// ============================================================
// Layer 4 — Nutrition Engine. Deterministic math only. No AI,
// no randomness, no external calls. Every number here must be
// traceable back to a named formula and constant below — this
// is the module the spec calls out for near-100% test coverage,
// since a silent bug here means real bad advice to a real person.
// ============================================================

// Mifflin-St Jeor — the most widely validated BMR equation in
// clinical use, more accurate than Harris-Benedict for most
// populations. Deliberately not using body-fat-based equations
// (e.g. Katch-McArdle) since we don't have reliable body fat %
// until Vision AI scans exist (Sprint 6).
export function calculateBmr(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// Calorie adjustment relative to TDEE, by goal. Deliberately
// conservative percentages — aggressive deficits/surpluses are a
// weekly-adaptation decision (Sprint 8), not a Day 1 default.
const CALORIE_ADJUSTMENT_PCT: Record<Goal, number> = {
  muscle_gain: 0.10, // modest surplus — controlled lean gain, not a dirty bulk
  fat_loss: -0.20, // moderate deficit — sustainable, preserves training performance
  recomposition: 0, // maintenance calories; recomp happens via training + protein, not calories
  general_fitness: 0, // maintenance
};

export function calculateDailyCalories(tdee: number, goal: Goal): number {
  return tdee * (1 + CALORIE_ADJUSTMENT_PCT[goal]);
}

// Protein target in g/kg bodyweight, by goal. Fat-loss gets the
// highest target — protein needs rise, not fall, in a deficit, to
// protect lean mass. Values are within standard sports-nutrition
// ranges (1.6-2.4 g/kg), not at the aggressive edge of them.
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  muscle_gain: 2.2,
  fat_loss: 2.4,
  recomposition: 2.2,
  general_fitness: 1.8,
};

const FAT_PCT_OF_CALORIES = 0.25;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARB = 4;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calculateNutrition(input: NutritionInput): NutritionResult {
  const bmr = calculateBmr(input.sex, input.weight_kg, input.height_cm, input.age);
  const tdee = calculateTdee(bmr, input.activity_level);
  const dailyCalories = calculateDailyCalories(tdee, input.goal);

  const proteinG = PROTEIN_G_PER_KG[input.goal] * input.weight_kg;
  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;

  const fatKcal = dailyCalories * FAT_PCT_OF_CALORIES;
  const fatG = fatKcal / KCAL_PER_G_FAT;

  const remainingKcal = dailyCalories - proteinKcal - fatKcal;
  const carbsG = Math.max(0, remainingKcal / KCAL_PER_G_CARB);

  return {
    bmr: round1(bmr),
    tdee: round1(tdee),
    daily_calories: round1(dailyCalories),
    protein_g: round1(proteinG),
    fat_g: round1(fatG),
    carbs_g: round1(carbsG),
  };
}
