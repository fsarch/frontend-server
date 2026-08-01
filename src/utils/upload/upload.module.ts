import { Module, forwardRef } from '@nestjs/common';
import { UploadService } from './upload.service.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { ProjectsModule } from '../../controller/admin/projects/projects.module.js';
import { StorageModule } from '../../storage/storage.module.js';

@Module({
  imports: [MetadataModule, forwardRef(() => ProjectsModule), StorageModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
