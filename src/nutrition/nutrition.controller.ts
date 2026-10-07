import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseJwtPayload } from '../auth/supabase-auth.guard';
import { NutritionService } from './nutrition.service';

@Controller('nutrition')
@UseGuards(SupabaseAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('targets')
  getTargets(@CurrentUser() user: SupabaseJwtPayload) {
    return this.nutritionService.getActiveTargets(user.sub);
  }
}
