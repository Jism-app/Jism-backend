export type Sex = 'male' | 'female';
export type Goal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'general_fitness';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface NutritionInput {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  activity_level: ActivityLevel;
}

export interface NutritionResult {
  bmr: number;
  tdee: number;
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}
