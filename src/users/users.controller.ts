import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard, AuthenticatedRequest } from '../auth/supabase-auth.guard';

@Controller()
export class UsersController {
  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return {
      id: req.user.sub,
      email: req.user.email ?? null,
    };
  }
}   