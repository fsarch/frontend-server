import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { MetadataService } from './metadata.service.js';
import { UploadService } from './upload.service.js';
import { FileService } from './file.service.js';
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
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, MetadataService, UploadService, FileService],
  exports: [ProjectsService, MetadataService, UploadService, FileService],
})
export class ProjectsModule {}
