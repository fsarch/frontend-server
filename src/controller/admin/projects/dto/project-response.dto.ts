import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Project } from '../../../../database/entities/project.entity.js';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the project',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the project',
    maxLength: 2048,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Id of the version that is currently served for this project',
    format: 'uuid',
  })
  currentVersionId?: string;

  @ApiProperty({
    description: 'Timestamp at which the project was created',
    format: 'date-time',
  })
  creationTime: Date;

  @ApiPropertyOptional({
    description: 'Timestamp at which the project was deleted, if it was deleted',
    format: 'date-time',
  })
  deletionTime?: Date;

  static fromEntity(project: Project): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.currentVersionId = project.currentVersionId;
    dto.creationTime = project.creationTime;
    dto.deletionTime = project.deletionTime;
    return dto;
  }
}
