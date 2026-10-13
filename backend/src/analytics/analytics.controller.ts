import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { LogViewDto } from './dto/log-view.dto';
import { Analytics } from './entities/analytics.entity';
import { AdminKeyGuard } from '../common/admin-key.guard';

const ADMIN = ApiHeader({ name: 'x-admin-key', description: 'Admin API key', required: true });

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  // ── POST /api/analytics/view ─────────────────────────────
  @Post('view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log a weather view for a city (increments counter)' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  logView(@Body() dto: LogViewDto): Promise<{ success: boolean }> {
    return this.service.logView(dto);
  }

  // ── GET /api/analytics/top ───────────────────────────────
  @Get('top')
  @UseGuards(AdminKeyGuard)
  @ADMIN
  @ApiOperation({ summary: 'Get top 10 most-viewed cities (admin)' })
  @ApiResponse({ status: 200, type: [Analytics] })
  getTopCities(): Promise<Analytics[]> {
    return this.service.getTopCities();
  }

  // ── GET /api/analytics/stats ─────────────────────────────
  @Get('stats')
  @UseGuards(AdminKeyGuard)
  @ADMIN
  @ApiOperation({ summary: 'Get overall analytics stats (admin)' })
  @ApiResponse({
    status: 200,
    description: '{ totalCities, totalViews, topCity }',
  })
  getStats() {
    return this.service.getStats();
  }
}
