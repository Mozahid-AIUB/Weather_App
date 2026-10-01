import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from './entities/search-history.entity';
import { CreateSearchHistoryDto } from './dto/create-search-history.dto';

@Injectable()
export class SearchHistoryService {
  constructor(
    @InjectRepository(SearchHistory)
    private readonly repo: Repository<SearchHistory>,
  ) {}

  /**
   * Save a new city search to PostgreSQL
   */
  async create(dto: CreateSearchHistoryDto): Promise<SearchHistory> {
    const entry = this.repo.create(dto);
    return this.repo.save(entry);
  }

  /**
   * Get the last 20 searches, newest first
   */
  async findAll(): Promise<SearchHistory[]> {
    return this.repo.find({
      order: { searchedAt: 'DESC' },
      take: 20,
    });
  }

  /**
   * Delete a single history entry by ID
   */
  async remove(id: string): Promise<{ success: boolean }> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Search history item ${id} not found`);
    }
    await this.repo.remove(entry);
    return { success: true };
  }

  /**
   * Clear all search history
   */
  async clear(): Promise<{ deleted: number }> {
    const all = await this.repo.find();
    await this.repo.remove(all);
    return { deleted: all.length };
  }
}
