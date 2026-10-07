import { Inject, Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import { NutritionService } from '../nutrition/nutrition.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly nutritionService: NutritionService,
  ) {}

  async getMe(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) {
      throw new NotFoundException('Profile not found — onboarding not completed');
    }
    return data;
  }

  async create(userId: string, dto: CreateProfileDto) {
    const existing = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing.data) {
      throw new ConflictException('Profile already exists — use PATCH to update it');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .insert({ id: userId, ...dto, onboarding_completed: true })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // Sprint 3: the moment a profile exists, the Nutrition Engine can run.
    // This is deliberately synchronous (awaited, not fire-and-forget) —
    // if this fails, the profile row already exists but the user has no
    // targets yet, which the frontend would surface as a confusing state.
    // Failing loudly here is better than a silent gap.
    await this.nutritionService.createInitialTargets(userId, {
      age: data.age,
      sex: data.sex,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      goal: data.goal,
      activity_level: data.activity_level,
    });

    return data;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Profile not found');
    return data;
  }
}
