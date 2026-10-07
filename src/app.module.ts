import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ExercisesModule } from './exercises/exercises.module';
import { NutritionModule } from './nutrition/nutrition.module';

// Remaining modules get populated as their sprints land.
// import { ScansModule } from './scans/scans.module';
// import { VisionAiModule } from './vision-ai/vision-ai.module';
// import { TrainingModule } from './training/training.module';
// import { AdaptationModule } from './adaptation/adaptation.module';
// import { CoachModule } from './coach/coach.module';
// import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ExercisesModule,
    NutritionModule,
    // ScansModule, VisionAiModule,
    // TrainingModule, AdaptationModule, CoachModule, SubscriptionsModule,
  ],
})
export class AppModule {}
