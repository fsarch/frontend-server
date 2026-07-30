import { Module } from '@nestjs/common';
import { VersionsService } from './versions.service.js';
import { VersionsController } from './versions.controller.js';
import { UploadModule } from "../../../../utils/upload/upload.module.js";

@Module({
  imports: [UploadModule],
  providers: [VersionsService],
  controllers: [VersionsController]
})
export class VersionsModule {}
