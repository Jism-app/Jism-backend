import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProfilesService } from './profiles.service';
import {
  createProfileSchema,
  updateProfileSchema,
  CreateProfileDto,
  UpdateProfileDto,
} from './dto/profile.dto';
import { SupabaseJwtPayload } from '../auth/supabase-auth.guard';

@Controller('profiles')
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMe(@CurrentUser() user: SupabaseJwtPayload) {
    return this.profilesService.getMe(user.sub);
  }

  @Post('me')
  create(
    @CurrentUser() user: SupabaseJwtPayload,
    @Body(new ZodValidationPipe(createProfileSchema)) dto: CreateProfileDto,
  ) {
    return this.profilesService.create(user.sub, dto);
  }

  @Patch('me')
  update(
    @CurrentUser() user: SupabaseJwtPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(user.sub, dto);
  }
}
