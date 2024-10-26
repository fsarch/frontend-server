import { Controller, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

import handleUpload from "../../../../utils/handleUpload.js";
import { invalidateMetaData } from "../../../../utils/updateMetaData.js";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";

@Controller({
  path: '/api/projects/:projectId/versions',
  version: '1',
})
@ApiTags('versions')
@ApiBearerAuth()
export class VersionsController {
  @Post()
  @ApiConsumes('application/octet-stream')
  public async Upload(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ) {
    await handleUpload(request, projectId);

    try {
      await invalidateMetaData(projectId);
    } catch (e) {
      console.error('error while invalidating meta data', e);
    }
  }
}
