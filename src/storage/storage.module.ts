import { ModuleConfigurationService } from '@fsarch/server/configuration';
import { Global, Module } from '@nestjs/common';
import { DATA_STORAGE_PROVIDER } from './storage.const.js';
import { StorageService } from './storage.service.js';
import { StorageConfig } from './storage-config.types.js';
import {
  STORAGE_CONFIG_TOKEN,
  StorageConfigurationDynamicModule,
} from './storage-configuration.module.js';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { IStorageProvider } from './storage-provider.interface.js';

@Global()
@Module({
  imports: [StorageConfigurationDynamicModule],
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
  exports: [
    DATA_STORAGE_PROVIDER,
    StorageService,
    StorageConfigurationDynamicModule,
  ],
})
export class StorageModule {}
