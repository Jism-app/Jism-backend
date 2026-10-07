// Standalone script — run with: npm run seed:exercises
// Deliberately doesn't spin up the full Nest application (would be slow
// and unnecessary for a one-off insert); connects directly with the same
// service-role credentials the app uses.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { EXERCISE_SEED } from './exercise-seed.data';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);

  console.log(`Seeding ${EXERCISE_SEED.length} exercises...`);

  // Idempotent-ish: check existing count first so re-running this doesn't
  // silently duplicate the whole catalog if someone runs it twice.
  const { count, error: countError } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Failed to check existing exercise count:', countError.message);
    process.exit(1);
  }

  if (count && count > 0) {
    console.log(`exercises table already has ${count} rows. Skipping seed to avoid duplicates.`);
    console.log('If you want to re-seed, truncate the table manually first.');
    process.exit(0);
  }

  const { error } = await supabase.from('exercises').insert(EXERCISE_SEED);

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${EXERCISE_SEED.length} exercises successfully.`);
}

main();
