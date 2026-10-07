import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuthModule, NutritionModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
