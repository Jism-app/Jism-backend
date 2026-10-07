import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { Request } from 'express';

export interface SupabaseJwtPayload extends JWTPayload {
  sub: string; // Supabase user id (uuid)
  email?: string;
  role?: string;
  [key: string]: any;
}

// Express Request, extended with the verified Supabase user.
export interface AuthenticatedRequest extends Request {
  user: SupabaseJwtPayload;
}

// Newer Supabase projects sign JWTs with ES256 (asymmetric) and publish
// the verification key at a public JWKS endpoint, rather than the legacy
// HS256 shared secret. createRemoteJWKSet caches the key set and handles
// rotation automatically, so we don't manage keys ourselves at all.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new UnauthorizedException('Server auth misconfigured');
    }

    if (!jwks) {
      jwks = createRemoteJWKSet(
        new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
      );
    }

    try {
      const { payload } = await jwtVerify(token, jwks);
      req.user = payload as SupabaseJwtPayload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: Request): string | null {
    const header = req.headers['authorization'];
    if (!header || Array.isArray(header)) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}