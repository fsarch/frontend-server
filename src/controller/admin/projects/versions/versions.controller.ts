import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  VERSION_DESCRIPTION_HEADER,
  VERSION_EXTERNAL_ID_HEADER,
  VERSION_NAME_HEADER,
} from '../../../../constants/app-constants.js';
import { Role } from '../../../../constants/role.enum.js';
import { UploadService } from '../../../../utils/upload/upload.service.js';
import { ProjectVersionResponseDto } from '../dto/project-version-response.dto.js';
import { UpdateProjectVersionDto } from './dto/update-project-version.dto.js';
import { VersionsService } from './versions.service.js';

@Controller({
  path: '/projects/:projectId/versions',
  version: '1',
})
@ApiTags('projects')
@ApiBearerAuth()
export class VersionsController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly versionsService: VersionsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.create_project_version)
  @ApiConsumes(
    'application/octet-stream',
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  )
  @ApiHeader({
    name: VERSION_NAME_HEADER,
    description: 'Optional name for the version',
    required: false,
  })
  @ApiHeader({
    name: VERSION_DESCRIPTION_HEADER,
    description: 'Optional description for the version',
    required: false,
  })
  @ApiHeader({
    name: VERSION_EXTERNAL_ID_HEADER,
    description:
      'Optional external id for the version, e.g. a build number or commit hash',
    required: false,
  })
  @ApiCreatedResponse({
    description: 'Version uploaded successfully, no response body',
  })
  public async uploadVersion(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.uploadService.handleUpload(request, projectId);
  }

  @Get(':versionId')
  @UseGuards(AuthGuard)
  @Roles(Role.read_project_version)
  @ApiOkResponse({ type: ProjectVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Version not found' })
  public async getVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ): Promise<ProjectVersionResponseDto> {
    const version = await this.versionsService.findVersion(
      projectId,
      versionId,
    );
    return ProjectVersionResponseDto.fromEntity(version);
  }

  @Patch(':versionId')
  @UseGuards(AuthGuard)
  @Roles(Role.write_project_version)
  @ApiOkResponse({ type: ProjectVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Version not found' })
  @UsePipes(new ValidationPipe())
  public async updateVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateProjectVersionDto,
  ): Promise<ProjectVersionResponseDto> {
    const version = await this.versionsService.updateVersion(
      projectId,
      versionId,
      dto,
    );
    return ProjectVersionResponseDto.fromEntity(version);
  }
}
