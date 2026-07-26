import { Module } from '@nestjs/common';

import { ControllerModule } from './controller/controller.module.js';

@Module({
  imports: [
    ControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
