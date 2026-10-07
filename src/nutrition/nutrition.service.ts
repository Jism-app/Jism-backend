import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import { calculateNutrition } from './nutrition.calculator';
import { NutritionInput } from './nutrition.types';

@Injectable()
export class NutritionService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  // Called right after a profile is created (see ProfilesService.create).
  // Writes a new nutrition_targets row with source: 'onboarding'. Per the
  // spec, targets are versioned and never overwritten — weekly adaptation
  // (Sprint 8) will insert new rows with source: 'weekly_adaptation'
  // rather than mutating this one.
  async createInitialTargets(userId: string, input: NutritionInput) {
    const result = calculateNutrition(input);

    const { data, error } = await this.supabase
      .from('nutrition_targets')
      .insert({
        user_id: userId,
        ...result,
        source: 'onboarding',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getActiveTargets(userId: string) {
    const { data, error } = await this.supabase
      .from('nutrition_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) {
      throw new NotFoundException('No nutrition targets yet — complete onboarding first');
    }
    return data;
  }
}
