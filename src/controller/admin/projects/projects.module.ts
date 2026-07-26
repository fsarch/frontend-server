import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { FileModule } from '../../../utils/file/file.module.js';
import { UploadModule } from '../../../utils/upload/upload.module.js';
import { MetadataModule } from '../../../utils/metadata/metadata.module.js';
import { Project } from '../../../database/entities/project.entity.js';
import { ProjectVersion } from '../../../database/entities/project-version.entity.js';
import { ProjectFile } from '../../../database/entities/project-file.entity.js';
import { VersionsModule } from './versions/versions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([ProjectVersion]),
    TypeOrmModule.forFeature([ProjectFile]),
    VersionsModule,
    FileModule,
    UploadModule,
    MetadataModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, FileModule, UploadModule, MetadataModule],
})
export class ProjectsModule {}
