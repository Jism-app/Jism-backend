import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [AuthModule],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService], // ProfilesModule needs this to trigger initial targets
})
export class NutritionModule {}
