import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { LogViewDto } from './dto/log-view.dto';
import { Analytics } from './entities/analytics.entity';

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
  @ApiOperation({ summary: 'Get top 10 most-viewed cities' })
  @ApiResponse({ status: 200, type: [Analytics] })
  getTopCities(): Promise<Analytics[]> {
    return this.service.getTopCities();
  }

  // ── GET /api/analytics/stats ─────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Get overall analytics stats' })
  @ApiResponse({
    status: 200,
    description: '{ totalCities, totalViews, topCity }',
  })
  getStats() {
    return this.service.getStats();
  }
}
