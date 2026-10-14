import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { PushService } from './push.service';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/register-device.dto';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly service: DevicesService,
    private readonly push: PushService,
  ) {}

  // ── POST /api/devices ────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register or update a phone for weather push notifications' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  register(@Body() dto: RegisterDeviceDto) {
    return this.service.register(dto);
  }

  // ── GET /api/devices (admin) ─────────────────────────────
  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiHeader({ name: 'x-admin-key', required: true })
  @ApiOperation({ summary: 'List registered phones (admin)' })
  list() {
    return this.service.list();
  }

  // ── POST /api/devices/test (admin) ───────────────────────
  @Post('test')
  @UseGuards(AdminKeyGuard)
  @ApiHeader({ name: 'x-admin-key', required: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test notification to every registered phone (admin)' })
  test(@Body() body: { title?: string; body?: string }) {
    return this.push.sendTest(body?.title || 'WeatherNow test ✅', body?.body || 'Push notifications are working on this phone.');
  }

  // ── POST /api/devices/unregister ─────────────────────────
  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop push notifications for a phone' })
  unregister(@Body() dto: UnregisterDeviceDto) {
    return this.service.unregister(dto.token);
  }
}
