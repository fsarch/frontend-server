import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    maxLength: 2048,
  })
  @IsString()
  @MaxLength(2048)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
