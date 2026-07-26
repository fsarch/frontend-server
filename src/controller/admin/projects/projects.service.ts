import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../../database/entities/project.entity.js';
import { ProjectVersion } from '../../../database/entities/project-version.entity.js';
import { ProjectFile } from '../../../database/entities/project-file.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectVersion)
    private readonly projectVersionRepository: Repository<ProjectVersion>,
  ) {}

  async createProject(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      name: dto.name,
      description: dto.description,
    });

    return await this.projectRepository.save(project);
  }

  async findAllProjects(): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { deletionTime: null },
      order: { creationTime: 'DESC' },
    });
  }

  async findProjectById(id: string): Promise<Project | null> {
    return await this.projectRepository.findOne({
      where: { id, deletionTime: null },
    });
  }

  async getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
    const project = await this.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return await this.projectVersionRepository.find({
      where: {
        projectId: project.id,
        deletionTime: null,
      },
      order: { creationTime: 'DESC' },
    });
  }

  async getAllVersions(): Promise<ProjectVersion[]> {
    return await this.projectVersionRepository.find({
      where: { deletionTime: null },
      order: { creationTime: 'DESC' },
    });
  }

  async setCurrentVersion(projectId: string, versionId: string): Promise<Project> {
    const project = await this.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    const version = await this.projectVersionRepository.findOne({
      where: { id: versionId, projectId: project.id, deletionTime: null },
    });

    if (!version) {
      throw new NotFoundException(`Version with id ${versionId} not found for project ${projectId}`);
    }

    project.currentVersionId = version.id;
    return await this.projectRepository.save(project);
  }
}
