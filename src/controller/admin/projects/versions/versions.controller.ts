import { Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { UploadService } from '../../../../utils/upload/upload.service.js';

@Controller({
  path: '/api/projects/:projectId/versions',
  version: '1',
})
@ApiTags('projects')
@ApiBearerAuth()
export class VersionsController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes('application/octet-stream')
  public async uploadVersion(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ) {
    await this.uploadService.handleUpload(request, projectId);
  }
}
