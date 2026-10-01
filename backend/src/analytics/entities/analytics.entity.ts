import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('weather_analytics')
@Unique(['city', 'country'])
@Index(['viewCount'])
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ length: 100 })
  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @Column({ length: 10 })
  @ApiProperty({ example: 'BD' })
  country: string;

  @Column({ name: 'view_count', default: 1 })
  @ApiProperty({ example: 42, description: 'Total weather views for this city' })
  viewCount: number;

  @UpdateDateColumn({ name: 'last_viewed' })
  @ApiProperty()
  lastViewed: Date;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty()
  createdAt: Date;
}
