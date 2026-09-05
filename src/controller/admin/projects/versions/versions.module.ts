import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionsService } from './versions.service.js';
import { VersionsController } from './versions.controller.js';
import { UploadModule } from "../../../../utils/upload/upload.module.js";
import { ProjectVersion } from '../../../../database/entities/project-version.entity.js';

@Module({
  imports: [UploadModule, TypeOrmModule.forFeature([ProjectVersion])],
  providers: [VersionsService],
  controllers: [VersionsController]
})
export class VersionsModule {}
