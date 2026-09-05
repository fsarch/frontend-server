import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectVersionDto {
  @ApiPropertyOptional({
    description: 'Name of the version',
    maxLength: 2048,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the version',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'External id of the version, e.g. a build number or commit hash',
    maxLength: 2048,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  externalId?: string;
}
