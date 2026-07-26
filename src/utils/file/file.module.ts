import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from './file.service.js';
import { ProjectFile } from '../../database/entities/project-file.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectFile])],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
