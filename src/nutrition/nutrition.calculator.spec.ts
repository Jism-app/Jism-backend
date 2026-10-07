import { calculateNutrition, calculateBmr, calculateTdee, calculateDailyCalories } from './nutrition.calculator';
import { NutritionInput } from './nutrition.types';

// Every expected value below was calculated by hand against the exact
// formulas in nutrition.calculator.ts (Mifflin-St Jeor BMR, documented
// activity multipliers, documented goal adjustments) before running the
// test, not derived by running the code and copying its output. That
// distinction is the whole point of this file — it catches the formula
// itself being wrong, not just catches it changing.

describe('calculateNutrition — hand-calculated profiles', () => {
  it('Profile 1: male, 25y, 180cm, 80kg, muscle_gain, moderate activity', () => {
    const input: NutritionInput = {
      age: 25,
      sex: 'male',
      height_cm: 180,
      weight_kg: 80,
      goal: 'muscle_gain',
      activity_level: 'moderate',
    };
    const result = calculateNutrition(input);

    // BMR = 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
    expect(result.bmr).toBe(1805.0);
    // TDEE = 1805 * 1.55 = 2797.75 -> rounds to 2797.8
    expect(result.tdee).toBe(2797.8);
    // daily_calories = 2797.75 * 1.10 = 3077.525 -> rounds to 3077.5
    expect(result.daily_calories).toBe(3077.5);
    // protein = 2.2 g/kg * 80kg = 176.0
    expect(result.protein_g).toBe(176.0);
    expect(result.fat_g).toBe(85.5);
    expect(result.carbs_g).toBe(401.0);
  });

  it('Profile 2: female, 30y, 165cm, 60kg, fat_loss, light activity', () => {
    const input: NutritionInput = {
      age: 30,
      sex: 'female',
      height_cm: 165,
      weight_kg: 60,
      goal: 'fat_loss',
      activity_level: 'light',
    };
    const result = calculateNutrition(input);

    // BMR = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    expect(result.bmr).toBe(1320.3);
    // TDEE = 1320.25 * 1.375 = 1815.34375 -> rounds to 1815.3
    expect(result.tdee).toBe(1815.3);
    // daily_calories = 1815.34375 * 0.80 = 1452.275 -> rounds to 1452.3
    expect(result.daily_calories).toBe(1452.3);
    // protein = 2.4 g/kg * 60kg = 144.0
    expect(result.protein_g).toBe(144.0);
    expect(result.fat_g).toBe(40.3);
    expect(result.carbs_g).toBe(128.3);
  });

  it('Profile 3: male, 40y, 175cm, 90kg, recomposition, active', () => {
    const input: NutritionInput = {
      age: 40,
      sex: 'male',
      height_cm: 175,
      weight_kg: 90,
      goal: 'recomposition',
      activity_level: 'active',
    };
    const result = calculateNutrition(input);

    // BMR = 10*90 + 6.25*175 - 5*40 + 5 = 900 + 1093.75 - 200 + 5 = 1798.75
    expect(result.bmr).toBe(1798.8);
    // TDEE = 1798.75 * 1.725 = 3102.84375 -> rounds to 3102.8
    expect(result.tdee).toBe(3102.8);
    // recomposition = 0% adjustment -> daily_calories == tdee (unrounded)
    expect(result.daily_calories).toBe(3102.8);
    // protein = 2.2 g/kg * 90kg = 198.0
    expect(result.protein_g).toBe(198.0);
    expect(result.fat_g).toBe(86.2);
    expect(result.carbs_g).toBe(383.8);
  });

  it('Profile 4: female, 22y, 160cm, 55kg, general_fitness, sedentary', () => {
    const input: NutritionInput = {
      age: 22,
      sex: 'female',
      height_cm: 160,
      weight_kg: 55,
      goal: 'general_fitness',
      activity_level: 'sedentary',
    };
    const result = calculateNutrition(input);

    // BMR = 10*55 + 6.25*160 - 5*22 - 161 = 550 + 1000 - 110 - 161 = 1279
    expect(result.bmr).toBe(1279.0);
    // TDEE = 1279 * 1.2 = 1534.8
    expect(result.tdee).toBe(1534.8);
    // general_fitness = 0% adjustment
    expect(result.daily_calories).toBe(1534.8);
    // protein = 1.8 g/kg * 55kg = 99.0
    expect(result.protein_g).toBe(99.0);
    expect(result.fat_g).toBe(42.6);
    expect(result.carbs_g).toBe(188.8);
  });
});

describe('calculateBmr — sex differential', () => {
  it('male formula adds +5, female formula subtracts -161, for identical inputs', () => {
    const male = calculateBmr('male', 70, 170, 30);
    const female = calculateBmr('female', 70, 170, 30);
    // Difference should be exactly 5 - (-161) = 166
    expect(male - female).toBeCloseTo(166, 5);
  });
});

describe('calculateTdee — activity multiplier ordering', () => {
  const bmr = 1500;
  it('strictly increases as activity level increases', () => {
    const sedentary = calculateTdee(bmr, 'sedentary');
    const light = calculateTdee(bmr, 'light');
    const moderate = calculateTdee(bmr, 'moderate');
    const active = calculateTdee(bmr, 'active');
    const veryActive = calculateTdee(bmr, 'very_active');

    expect(sedentary).toBeLessThan(light);
    expect(light).toBeLessThan(moderate);
    expect(moderate).toBeLessThan(active);
    expect(active).toBeLessThan(veryActive);
  });
});

describe('calculateDailyCalories — goal ordering (safety invariant)', () => {
  it('fat_loss < maintenance goals < muscle_gain, for the same TDEE', () => {
    const tdee = 2500;
    const fatLoss = calculateDailyCalories(tdee, 'fat_loss');
    const recomp = calculateDailyCalories(tdee, 'recomposition');
    const general = calculateDailyCalories(tdee, 'general_fitness');
    const muscleGain = calculateDailyCalories(tdee, 'muscle_gain');

    expect(fatLoss).toBeLessThan(recomp);
    expect(fatLoss).toBeLessThan(general);
    expect(muscleGain).toBeGreaterThan(recomp);
    expect(muscleGain).toBeGreaterThan(general);
  });
});

describe('calculateNutrition — macro/calorie conservation', () => {
  it('protein + fat + carb calories sum to approximately daily_calories', () => {
    const input: NutritionInput = {
      age: 35,
      sex: 'male',
      height_cm: 178,
      weight_kg: 85,
      goal: 'fat_loss',
      activity_level: 'very_active',
    };
    const result = calculateNutrition(input);
    const proteinKcal = result.protein_g * 4;
    const fatKcal = result.fat_g * 9;
    const carbKcal = result.carbs_g * 4;
    const total = proteinKcal + fatKcal + carbKcal;

    // Small tolerance for rounding each macro independently to 1 decimal.
    expect(total).toBeCloseTo(result.daily_calories, 0);
  });

  it('never returns negative carbs even for extreme inputs', () => {
    // Very low weight + high protein target + fat_loss deficit is the
    // scenario most likely to drive carbs negative if the formula is
    // wrong — this must clamp to 0, not return a negative gram value.
    const input: NutritionInput = {
      age: 20,
      sex: 'female',
      height_cm: 150,
      weight_kg: 40,
      goal: 'fat_loss',
      activity_level: 'sedentary',
    };
    const result = calculateNutrition(input);
    expect(result.carbs_g).toBeGreaterThanOrEqual(0);
  });
});
