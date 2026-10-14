import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @Matches(/^Expo(nent)?PushToken\[[^\]]+\]$/)
  token: string;

  @ApiProperty({ example: 23.8103 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 90.4125 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @ApiProperty({ example: 'Mirpur' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  place: string;

  @ApiProperty({ enum: ['metric', 'imperial'] })
  @IsIn(['metric', 'imperial'])
  unit: 'metric' | 'imperial';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  userName?: string;

  @ApiProperty()
  @IsBoolean()
  morningBrief: boolean;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(0)
  @Max(23)
  briefHour: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  eveningBrief?: boolean;

  @ApiProperty({ required: false, example: 19 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  eveningHour?: number;

  @ApiProperty({ example: 360, description: 'Minutes east of UTC' })
  @IsInt()
  @Min(-840)
  @Max(840)
  tzOffset: number;

  @ApiProperty({ example: { storm: true, rain: true, temperature: true, wind: true } })
  @IsObject()
  alerts: Record<string, boolean>;
}

export class UnregisterDeviceDto {
  @ApiProperty()
  @IsString()
  @Matches(/^Expo(nent)?PushToken\[[^\]]+\]$/)
  token: string;
}
