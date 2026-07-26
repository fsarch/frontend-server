import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ControllerModule } from './controller/controller.module.js';
import configuration from './configuration.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    StorageModule,
    ControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
