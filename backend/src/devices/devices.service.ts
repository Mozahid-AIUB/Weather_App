import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(Device) private readonly repo: Repository<Device>) {}

  /** Creates or updates the phone's settings; moving to another place resets sent alerts. */
  async register(dto: RegisterDeviceDto): Promise<{ success: boolean }> {
    const existing = await this.repo.findOne({ where: { token: dto.token } });
    const moved = !existing || existing.place !== dto.place;
    await this.repo.save({
      ...existing,
      ...dto,
      userName: dto.userName ?? '',
      sentIds: moved ? [] : existing!.sentIds,
    });
    return { success: true };
  }

  /** Admin overview: registered phones without exposing push tokens in full. */
  async list() {
    const all = await this.repo.find({ order: { updatedAt: 'DESC' } });
    return all.map((d) => ({
      place: d.place,
      unit: d.unit,
      morning: d.morningBrief ? d.briefHour : null,
      evening: d.eveningBrief ? d.eveningHour : null,
      tzOffset: d.tzOffset,
      token: `${d.token.slice(0, 22)}…`,
      lastBrief: d.lastBriefDate,
      lastEvening: d.lastEveningDate,
      sentAlerts: d.sentIds.length,
      updatedAt: d.updatedAt,
    }));
  }

  async unregister(token: string): Promise<{ success: boolean }> {
    await this.repo.delete({ token });
    return { success: true };
  }
}
