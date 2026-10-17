import { ModuleConfigurationService } from '@fsarch/server/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { DATA_STORAGE_PROVIDER } from './storage.const.js';
import { StorageService } from './storage.service.js';
import { StorageConfig } from './storage-config.types.js';
import {
  createStorageConfigurationModule,
  STORAGE_CONFIG_TOKEN,
} from './storage-configuration.module.js';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { IStorageProvider } from './storage-provider.interface.js';

/**
 * `serviceId`, when set (passed by a mono-service harness mounting this
 * service via `.addService()`), scopes `storage.data` to that mount's own
 * entry in the `services` config array and makes `StorageService`/
 * `DATA_STORAGE_PROVIDER` plain module-local providers instead of
 * `@Global()` — a `@Global()` module is a process-wide singleton
 * regardless of dynamic options, so two mounted instances would otherwise
 * fight over which storage config "wins" for the whole process. Omitted
 * (today's standalone behavior, unchanged), still `@Global()`-equivalent:
 * every other module in the process can still inject `StorageService`
 * without importing this module explicitly, because the thin standalone
 * `main.ts` is the only consumer of this parameter and never sets it.
 */
@Module({})
export class StorageModule {
  static register(serviceId?: string): DynamicModule {
    return {
      module: StorageModule,
      global: !serviceId,
      imports: [createStorageConfigurationModule(serviceId)],
      providers: [
        StorageService,
        {
          provide: DATA_STORAGE_PROVIDER,
          useFactory: (
            configService: ModuleConfigurationService<any>,
          ): IStorageProvider => {
            const storageConfig = configService.get();
            return StorageProviderFactory.create(storageConfig);
          },
          inject: [STORAGE_CONFIG_TOKEN],
        },
      ],
      exports: [DATA_STORAGE_PROVIDER, StorageService],
    };
  }
}
