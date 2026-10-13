import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Protects admin-only routes (reading or deleting stored data). Requests must send the
 * `x-admin-key` header matching ADMIN_API_KEY; with no key configured, these routes stay closed.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_KEY;
    const given = context.switchToHttp().getRequest().headers['x-admin-key'];
    if (!expected || typeof given !== 'string') throw new ForbiddenException('Admin key required');

    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ForbiddenException('Admin key required');
    return true;
  }
}
