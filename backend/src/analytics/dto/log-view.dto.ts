import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogViewDto {
  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'BD' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  country: string;
}
