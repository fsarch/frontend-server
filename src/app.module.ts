import { Module } from '@nestjs/common';

import { FsarchModule } from "./fsarch/fsarch.module.js";
import { ControllerModule } from './controller/controller.module.js';

@Module({
  imports: [
    FsarchModule.register({
      auth: {},
    }),
    ControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
