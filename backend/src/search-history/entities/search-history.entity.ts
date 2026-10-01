import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('search_history')
@Index(['searchedAt'])
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @Column({ length: 100 })
  @ApiProperty({ example: 'Dhaka', description: 'City name' })
  city: string;

  @Column({ length: 10 })
  @ApiProperty({ example: 'BD', description: 'Country code' })
  country: string;

  @Column('decimal', { precision: 9, scale: 6 })
  @ApiProperty({ example: 23.8103, description: 'Latitude' })
  lat: number;

  @Column('decimal', { precision: 9, scale: 6 })
  @ApiProperty({ example: 90.4125, description: 'Longitude' })
  lon: number;

  @CreateDateColumn({ name: 'searched_at' })
  @ApiProperty({ description: 'When this city was searched' })
  searchedAt: Date;
}
