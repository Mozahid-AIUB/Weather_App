import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** A phone registered for server-sent weather alerts and the morning brief. */
@Entity('push_devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 200 })
  token: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lon: number;

  @Column({ length: 100 })
  place: string;

  @Column({ length: 10, default: 'metric' })
  unit: 'metric' | 'imperial';

  @Column({ name: 'user_name', length: 30, default: '' })
  userName: string;

  @Column({ name: 'morning_brief', default: true })
  morningBrief: boolean;

  @Column({ name: 'brief_hour', default: 7 })
  briefHour: number;

  @Column({ name: 'evening_brief', default: true })
  eveningBrief: boolean;

  @Column({ name: 'evening_hour', default: 19 })
  eveningHour: number;

  /** Minutes east of UTC on the phone, e.g. 360 for Dhaka. */
  @Column({ name: 'tz_offset', default: 0 })
  tzOffset: number;

  /** Which alert groups the user enabled: storm, rain, temperature, wind. */
  @Column('simple-json', { default: '{"storm":true,"rain":true,"temperature":true,"wind":true}' })
  alerts: Record<string, boolean>;

  /** Alert ids already pushed, so an event is sent once. */
  @Column('simple-json', { name: 'sent_ids', default: '[]' })
  sentIds: string[];

  @Column({ name: 'last_brief_date', length: 10, default: '' })
  lastBriefDate: string;

  @Column({ name: 'last_evening_date', length: 10, default: '' })
  lastEveningDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
