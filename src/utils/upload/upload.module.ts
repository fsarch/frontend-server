import { forwardRef, Module } from '@nestjs/common';
import { ProjectsModule } from '../../controller/admin/projects/projects.module.js';
import { StorageModule } from '../../storage/storage.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { UploadService } from './upload.service.js';

@Module({
  imports: [MetadataModule, forwardRef(() => ProjectsModule), StorageModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
