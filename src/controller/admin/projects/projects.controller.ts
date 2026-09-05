import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from "@fsarch/server/auth";
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectResponseDto } from './dto/project-response.dto.js';
import { ProjectVersionResponseDto } from './dto/project-version-response.dto.js';
import { FileService } from '../../../utils/file/file.service.js';

@ApiTags('projects')
@Controller({
  path: '/projects',
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
  @ApiCreatedResponse({ type: ProjectResponseDto })
  @UsePipes(new ValidationPipe())
  async createProject(
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.createProject(dto);
    return ProjectResponseDto.fromEntity(project);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  async getAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsService.findAllProjects();
    return projects.map((project) => ProjectResponseDto.fromEntity(project));
  }

  @Get(':projectId')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ProjectResponseDto })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async getProject(@Param('projectId') projectId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    return ProjectResponseDto.fromEntity(project);
  }

  @Get(':projectId/versions')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ProjectVersionResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async getProjectVersions(
    @Param('projectId') projectId: string,
  ): Promise<ProjectVersionResponseDto[]> {
    const versions = await this.projectsService.getProjectVersions(projectId);
    return versions.map((version) => ProjectVersionResponseDto.fromEntity(version));
  }

  @Get('versions')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ProjectVersionResponseDto, isArray: true })
  async getAllVersions(): Promise<ProjectVersionResponseDto[]> {
    const versions = await this.projectsService.getAllVersions();
    return versions.map((version) => ProjectVersionResponseDto.fromEntity(version));
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

  @Get(':projectId/resolve/{*path}')
  @Public()
  async getProjectFile(
    @Param('projectId') projectId: string,
    @Param('path') pathParts: Array<string>,
    @Param() params: Array<string>,
    @Headers() headers: Record<string, string>,
    @Res() response: Response,
  ): Promise<void> {
    return this.fileService.handleFile(headers, response, projectId, pathParts.join('/'));
  }
}
