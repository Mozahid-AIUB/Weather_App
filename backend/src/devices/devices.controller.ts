import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/register-device.dto';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  // ── POST /api/devices ────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register or update a phone for weather push notifications' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  register(@Body() dto: RegisterDeviceDto) {
    return this.service.register(dto);
  }

  // ── POST /api/devices/unregister ─────────────────────────
  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop push notifications for a phone' })
  unregister(@Body() dto: UnregisterDeviceDto) {
    return this.service.unregister(dto.token);
  }
}
