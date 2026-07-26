import { Project } from './entities/project.entity.js';
import { ProjectVersion } from './entities/project-version.entity.js';
import { ProjectFile } from './entities/project-file.entity.js';
import { BaseTablesMigration1785082695000 } from './migrations/1785082695000-base-tables.migration.js';

export const DATABASE_OPTIONS = {
  entities: [
    Project,
    ProjectVersion,
    ProjectFile,
  ],
  migrations: [
    BaseTablesMigration1785082695000,
  ],
};
