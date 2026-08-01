import { Module, Global } from '@nestjs/common';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { IStorageProvider } from './storage-provider.interface.js';
import { STORAGE_CONFIG_TOKEN, StorageConfigurationDynamicModule } from './storage-configuration.module.js';
import { ModuleConfigurationService } from '@fsarch/server/configuration';
import { StorageConfig } from './storage-config.types.js';
import { StorageService } from './storage.service.js';
import { DATA_STORAGE_PROVIDER } from "./storage.const.js";


@Global()
@Module({
  imports: [StorageConfigurationDynamicModule],
  providers: [
    StorageService,
    {
      provide: DATA_STORAGE_PROVIDER,
      useFactory: (configService: ModuleConfigurationService<any>): IStorageProvider => {
        const storageConfig = configService.get();
        return StorageProviderFactory.create(storageConfig);
      },
      inject: [STORAGE_CONFIG_TOKEN],
    },
  ],
  exports: [DATA_STORAGE_PROVIDER, StorageService, StorageConfigurationDynamicModule],
})
export class StorageModule {}
