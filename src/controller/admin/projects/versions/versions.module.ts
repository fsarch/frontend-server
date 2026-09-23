import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectVersion } from '../../../../database/entities/project-version.entity.js';
import { UploadModule } from '../../../../utils/upload/upload.module.js';
import { VersionsController } from './versions.controller.js';
import { VersionsService } from './versions.service.js';

@Module({
  imports: [UploadModule, TypeOrmModule.forFeature([ProjectVersion])],
  providers: [VersionsService],
  controllers: [VersionsController],
})
export class VersionsModule {}
