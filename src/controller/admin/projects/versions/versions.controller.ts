import { Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiHeader, ApiTags } from "@nestjs/swagger";
import { UploadService } from '../../../../utils/upload/upload.service.js';
import {
  VERSION_DESCRIPTION_HEADER,
  VERSION_EXTERNAL_ID_HEADER,
  VERSION_NAME_HEADER,
} from '../../../../constants/app-constants.js';

@Controller({
  path: '/projects/:projectId/versions',
  version: '1',
})
@ApiTags('projects')
@ApiBearerAuth()
export class VersionsController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes(
    'application/octet-stream',
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  )
  @ApiHeader({ name: VERSION_NAME_HEADER, description: 'Optional name for the version', required: false })
  @ApiHeader({ name: VERSION_DESCRIPTION_HEADER, description: 'Optional description for the version', required: false })
  @ApiHeader({ name: VERSION_EXTERNAL_ID_HEADER, description: 'Optional external id for the version, e.g. a build number or commit hash', required: false })
  @ApiCreatedResponse({ description: 'Version uploaded successfully, no response body' })
  public async uploadVersion(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.uploadService.handleUpload(request, projectId);
  }
}
