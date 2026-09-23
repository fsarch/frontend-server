import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFile } from '../../database/entities/project-file.entity.js';
import { StorageModule } from '../../storage/storage.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { FileService } from './file.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFile]),
    MetadataModule,
    StorageModule,
  ],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
