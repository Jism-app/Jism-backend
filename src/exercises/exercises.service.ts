import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';

export interface ExerciseFilters {
  muscle?: string;
  equipment?: string;
  movementPattern?: string;
}

@Injectable()
export class ExercisesService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  // No user scoping needed — exercises is the one public-read catalog
  // table per the spec (RLS policy: "public read exercises", using(true)).
  async findAll(filters: ExerciseFilters) {
    let query = this.supabase.from('exercises').select('*');

    if (filters.muscle) {
      query = query.contains('primary_muscles', [filters.muscle]);
    }
    if (filters.equipment) {
      query = query.contains('equipment', [filters.equipment]);
    }
    if (filters.movementPattern) {
      query = query.eq('movement_pattern', filters.movementPattern);
    }

    const { data, error } = await query.order('name');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
