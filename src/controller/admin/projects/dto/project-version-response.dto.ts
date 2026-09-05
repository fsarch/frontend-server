import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectVersion } from '../../../../database/entities/project-version.entity.js';

export class ProjectVersionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the version',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Id of the project this version belongs to',
    format: 'uuid',
  })
  projectId: string;

  @ApiProperty({
    description: 'Timestamp at which the version was created',
    format: 'date-time',
  })
  creationTime: Date;

  @ApiPropertyOptional({
    description: 'Timestamp at which the version was deleted, if it was deleted',
    format: 'date-time',
  })
  deletionTime?: Date;

  static fromEntity(version: ProjectVersion): ProjectVersionResponseDto {
    const dto = new ProjectVersionResponseDto();
    dto.id = version.id;
    dto.projectId = version.projectId;
    dto.creationTime = version.creationTime;
    dto.deletionTime = version.deletionTime;
    return dto;
  }
}
