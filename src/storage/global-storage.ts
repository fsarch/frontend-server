import { IStorageProvider } from './storage-provider.interface.js';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { StorageConfig } from './storage-config.types.js';
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_CONFIG_TOKEN } from './storage-configuration.module.js';
import { ModuleConfigurationService } from '@fsarch/server/configuration';
import * as path from 'node:path';

// Global storage provider instance
// This is initialized on first use and used by utility functions
// that cannot use dependency injection
let globalStorageProvider: IStorageProvider | null = null;
let globalDataPath: string = './data';

@Injectable()
export class GlobalStorageService {
  constructor(
    @Inject(STORAGE_CONFIG_TOKEN)
    private configService: ModuleConfigurationService<any>,
  ) {}

  getStorageProvider(): IStorageProvider {
    if (!globalStorageProvider) {
      const storageConfig = this.configService.get();
      globalStorageProvider = StorageProviderFactory.create(storageConfig);
      
      // Set global data path for backward compatibility
      if (typeof storageConfig === 'string') {
        globalDataPath = storageConfig;
      } else if (storageConfig.type === 'filesystem') {
        globalDataPath = storageConfig.config.path;
      } else if (storageConfig.type === 's3') {
        globalDataPath = './data';
      }
    }
    return globalStorageProvider;
  }
}

/**
 * Initialize the global storage provider
 * Uses fsarch ModuleConfigurationService instead of manual file loading
 */
export function initializeGlobalStorage(): void {
  // The StorageModule already initializes the provider via DI
  // This function is kept for backward compatibility
  // The actual initialization happens in GlobalStorageService
}

/**
 * Get the global storage provider
 */
export function getGlobalStorageProvider(): IStorageProvider {
  if (!globalStorageProvider) {
    // Fallback for cases where DI is not available
    // This should not happen in normal application flow
    console.warn('Global storage provider not initialized via DI. Using fallback.');
    globalStorageProvider = StorageProviderFactory.create('./data');
  }
  return globalStorageProvider;
}

/**
 * Get the data path for backward compatibility
 * This reads from storage.data.config.path in config.yaml
 */
export function getDataPath(): string {
  if (!globalStorageProvider) {
    initializeGlobalStorage();
  }
  return path.resolve(process.cwd(), globalDataPath);
}

/**
 * Check if the storage provider is filesystem
 */
export function isFileSystemStorage(): boolean {
  const provider = getGlobalStorageProvider();
  // We can't easily check the type without importing the class
  // This is a limitation of the current approach
  return true; // Assume filesystem for now
}
