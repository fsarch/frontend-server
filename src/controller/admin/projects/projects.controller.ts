import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from "@fsarch/server/auth";
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { Project } from '../../../database/entities/project.entity.js';
import { ProjectVersion } from '../../../database/entities/project-version.entity.js';
import { FileService, Headers as FileHeaders } from './file.service.js';

@ApiTags('projects')
@Controller({
  path: '/api/projects',
  version: '1',
})
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly fileService: FileService,
  ) {}

  // ============ Projekt-Management Endpunkte ============

  @Post()
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  async createProject(
    @Body() dto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectsService.createProject(dto);
  }

  @Get()
  @ApiBearerAuth()
  async getAllProjects(): Promise<Project[]> {
    return this.projectsService.findAllProjects();
  }

  @Get(':projectId')
  @ApiBearerAuth()
  async getProject(@Param('projectId') projectId: string): Promise<Project> {
    const project = await this.projectsService.findProjectById(projectId);
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }
    return project;
  }

  @Get(':projectId/versions')
  @ApiBearerAuth()
  async getProjectVersions(
    @Param('projectId') projectId: string,
  ): Promise<ProjectVersion[]> {
    return this.projectsService.getProjectVersions(projectId);
  }

  @Get('versions')
  @ApiBearerAuth()
  async getAllVersions(): Promise<ProjectVersion[]> {
    return this.projectsService.getAllVersions();
  }

  // ============ Datei-Zugriff Endpunkte (ersetzt /projects/:projectId) ============

  @Get(':projectId/resolve')
  @Public()
  async getMainProjectFile(
    @Param('projectId') projectId: string,
    @Headers() headers: Record<string, string>,
    @Res() response: Response,
  ): Promise<void> {
    return this.fileService.handleFile(headers, response, projectId, 'index.html');
  }

  @Get(':projectId/resolve/*')
  @Public()
  async getProjectFile(
    @Param('projectId') projectId: string,
    @Param() params: Array<string>,
    @Headers() headers: Record<string, string>,
    @Res() response: Response,
  ): Promise<void> {
    const resourcePath = params[0] ?? '';
    return this.fileService.handleFile(headers, response, projectId, resourcePath);
  }
}
