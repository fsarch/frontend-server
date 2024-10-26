import { Module } from '@nestjs/common';
import { VersionsService } from './versions.service.js';
import { VersionsController } from './versions.controller.js';

@Module({
  providers: [VersionsService],
  controllers: [VersionsController]
})
export class VersionsModule {}
