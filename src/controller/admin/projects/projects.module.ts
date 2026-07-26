import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { DatabaseUtilsModule } from '../../../utils/database/database-utils.module.js';
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
    DatabaseUtilsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, DatabaseUtilsModule],
})
export class ProjectsModule {}
