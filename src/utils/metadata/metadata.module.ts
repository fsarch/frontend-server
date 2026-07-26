import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataService } from './metadata.service.js';
import { ProjectFile } from '../../database/entities/project-file.entity.js';
import { ProjectVersion } from '../../database/entities/project-version.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFile]),
    TypeOrmModule.forFeature([ProjectVersion]),
  ],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
