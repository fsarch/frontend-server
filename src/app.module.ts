import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ControllerModule } from './controller/controller.module.js';
import configuration from './configuration.js';
import { StorageModule } from './storage/storage.module.js';
import { Project } from './database/entities/project.entity.js';
import { ProjectVersion } from './database/entities/project-version.entity.js';
import { ProjectFile } from './database/entities/project-file.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    StorageModule,
    ControllerModule,
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([ProjectVersion]),
    TypeOrmModule.forFeature([ProjectFile]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
