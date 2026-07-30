import { Module, Global } from '@nestjs/common';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { IStorageProvider } from './storage-provider.interface.js';
import { STORAGE_CONFIG_TOKEN, StorageConfigurationDynamicModule } from './storage-configuration.module.js';
import { ModuleConfigurationService } from '@fsarch/server/configuration';
import { StorageConfig } from './storage-config.types.js';

export const DATA_STORAGE_PROVIDER = 'DATA_STORAGE_PROVIDER';

@Global()
@Module({
  imports: [StorageConfigurationDynamicModule],
  providers: [
    {
      provide: DATA_STORAGE_PROVIDER,
      useFactory: (configService: ModuleConfigurationService<any>): IStorageProvider => {
        const storageConfig = configService.get();
        return StorageProviderFactory.create(storageConfig);
      },
      inject: [STORAGE_CONFIG_TOKEN],
    },
  ],
  exports: [DATA_STORAGE_PROVIDER, StorageConfigurationDynamicModule],
})
export class StorageModule {}
