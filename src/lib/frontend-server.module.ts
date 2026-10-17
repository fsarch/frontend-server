import { createServiceModule } from '@fsarch/server';
import { Project } from '../database/entities/project.entity.js';
import { ProjectFile } from '../database/entities/project-file.entity.js';
import { ProjectVersion } from '../database/entities/project-version.entity.js';
import { ProjectsController } from '../controller/admin/projects/projects.controller.js';
import { ProjectsService } from '../controller/admin/projects/projects.service.js';
import { VersionsController } from '../controller/admin/projects/versions/versions.controller.js';
import { VersionsService } from '../controller/admin/projects/versions/versions.service.js';
import { FileService } from '../utils/file/file.service.js';
import { UploadService } from '../utils/upload/upload.service.js';
import { MetadataService } from '../utils/metadata/metadata.service.js';
import { StorageModule } from '../storage/storage.module.js';

/**
 * The service's feature module, generated via `@fsarch/server`'s
 * `createServiceModule()` instead of hand-written as `app.module.ts` used
 * to be. Flattens what was previously a 7-module tree
 * (AdminModule -> ProjectsModule -> VersionsModule, plus FileModule/
 * UploadModule/MetadataModule each doing their own unscoped
 * `TypeOrmModule.forFeature(...)`) into one module, because
 * `createServiceModule()`'s single `TypeOrmModule.forFeature(entities,
 * connectionName)` call only covers providers/controllers declared
 * *directly* in the module it generates — a nested module doing its own
 * separate `forFeature()` would still bind to the *default* connection,
 * which doesn't exist in a mono-service mount (every mount gets a *named*
 * connection, see `FsArchAppBuilder.addService()`). Flattening avoids
 * threading `connectionName` through every nested module individually.
 *
 * `StorageModule` is the one sub-module kept separate (via `imports`
 * below) because it has its own mount-scoped config section
 * (`storage.data`) — see `StorageModule.register()`'s doc comment.
 */
export const FrontendServerModule = createServiceModule({
  entities: [Project, ProjectVersion, ProjectFile],
  controllers: [ProjectsController, VersionsController],
  providers: [ProjectsService, VersionsService, FileService, UploadService, MetadataService],
  imports: (connectionName) => [StorageModule.register(connectionName)],
  exports: [ProjectsService, FileService, UploadService, MetadataService],
});
