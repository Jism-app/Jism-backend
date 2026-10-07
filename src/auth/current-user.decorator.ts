import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, SupabaseJwtPayload } from './supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupabaseJwtPayload => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user;
  },
);
