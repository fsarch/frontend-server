import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module.js';

@Module({
  imports: [ProjectsModule]
})
export class AdminModule {}
