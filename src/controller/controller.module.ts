import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { ProjectsModule } from './projects/projects.module.js';

@Module({
  imports: [AdminModule, ProjectsModule]
})
export class ControllerModule {}
