import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from "../../fsarch/auth/decorators/public.decorator.js";
import handleFile from "../../utils/handleFile.js";

@Controller({
  path: '/projects',
  version: '1',
})
@Public()
export class ProjectsController {
  @Get(':projectId')
  public async GetMainProjectFile(
    @Param('projectId') projectId: string,
    @Headers() headers: Headers,
    @Res() response: Response,
  ) {
    const resourcePath = 'index.html';

    return await handleFile(headers, response, projectId, resourcePath);
  }

  @Get(':projectId/*')
  public async GetProjectFile(
    @Param('projectId') projectId: string,
    @Param() params: Array<string>,
    @Headers() headers: Headers,
    @Res() response: Response,
  ) {
    const resourcePath = params[0] ?? '';

    return await handleFile(headers, response, projectId, resourcePath);
  }
}
