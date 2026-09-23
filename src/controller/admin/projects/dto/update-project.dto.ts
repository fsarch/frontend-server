import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Name of the project',
    maxLength: 2048,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Id of the version to activate as the current version of the project',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  currentVersionId?: string;
}
