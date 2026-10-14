import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PRIVACY_HTML } from './privacy.html';

/** Public pages linked from Google Play (served outside the /api prefix). */
@ApiExcludeController()
@Controller()
export class LegalController {
  // ── GET /privacy ─────────────────────────────────────────
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  privacy() {
    return PRIVACY_HTML;
  }
}
