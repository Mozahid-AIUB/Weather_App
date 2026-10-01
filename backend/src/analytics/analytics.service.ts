import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';
import { LogViewDto } from './dto/log-view.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly repo: Repository<Analytics>,
  ) {}

  /**
   * Upsert: increment viewCount if city exists, else create new entry
   */
  async logView(dto: LogViewDto): Promise<{ success: boolean }> {
    const existing = await this.repo.findOne({
      where: { city: dto.city, country: dto.country },
    });

    if (existing) {
      await this.repo.update(existing.id, {
        viewCount: existing.viewCount + 1,
        // lastViewed is auto-updated by @UpdateDateColumn
      });
    } else {
      const entry = this.repo.create({ ...dto, viewCount: 1 });
      await this.repo.save(entry);
    }

    return { success: true };
  }

  /**
   * Get top 10 most-viewed cities
   */
  async getTopCities(): Promise<Analytics[]> {
    return this.repo.find({
      order: { viewCount: 'DESC' },
      take: 10,
    });
  }

  /**
   * Get overall stats
   */
  async getStats(): Promise<{
    totalCities: number;
    totalViews: number;
    topCity: string | null;
  }> {
    const result = await this.repo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.city)', 'totalCities')
      .addSelect('SUM(a.view_count)', 'totalViews')
      .getRawOne();

    const top = await this.repo.findOne({
      order: { viewCount: 'DESC' },
    });

    return {
      totalCities: parseInt(result.totalCities) || 0,
      totalViews: parseInt(result.totalViews) || 0,
      topCity: top ? `${top.city}, ${top.country}` : null,
    };
  }
}
