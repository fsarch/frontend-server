import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProjectVersion } from '../../../../database/entities/project-version.entity.js';
import { UpdateProjectVersionDto } from './dto/update-project-version.dto.js';

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(ProjectVersion)
    private readonly projectVersionRepository: Repository<ProjectVersion>,
  ) {}

  async updateVersion(
    projectId: string,
    versionId: string,
    dto: UpdateProjectVersionDto,
  ): Promise<ProjectVersion> {
    const version = await this.projectVersionRepository.findOne({
      where: { id: versionId, projectId, deletionTime: IsNull() },
    });

    if (!version) {
      throw new NotFoundException(`Version with id ${versionId} not found for project ${projectId}`);
    }

    if (dto.name !== undefined) {
      version.name = dto.name;
    }
    if (dto.description !== undefined) {
      version.description = dto.description;
    }
    if (dto.externalId !== undefined) {
      version.externalId = dto.externalId;
    }

    return await this.projectVersionRepository.save(version);
  }
}
