import { IsString, IsNumber, IsNotEmpty, Length, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSearchHistoryDto {
  @ApiProperty({ example: 'Dhaka', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'BD', description: '2-letter country code' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  country: string;

  @ApiProperty({ example: 23.8103, description: 'Latitude (-90 to 90)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 90.4125, description: 'Longitude (-180 to 180)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}
