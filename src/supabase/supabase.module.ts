import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.constants';

// Global so every feature module (profiles, nutrition, training, ...) can
// inject SUPABASE_CLIENT without re-importing this module everywhere.
//
// IMPORTANT: this client uses the SERVICE ROLE key, which bypasses Row
// Level Security entirely. That's intentional — the backend is a trusted
// server, not the end user's browser — but it means every query written
// against this client MUST manually filter by the authenticated user's id
// (e.g. .eq('user_id', userId)) exactly where RLS would have. Forgetting
// this is the single easiest way to leak one user's data to another.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('SUPABASE_URL');
        const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !serviceRoleKey) {
          throw new Error(
            'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env',
          );
        }
        return createClient(url, serviceRoleKey, {
          auth: { persistSession: false },
        });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
