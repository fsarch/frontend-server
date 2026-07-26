import { IStorageProvider } from './storage-provider.interface.js';
import { StorageProviderFactory } from './storage-provider.factory.js';
import { StorageConfig } from './storage-config.types.js';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { resolve } from 'node:path';
import * as path from 'node:path';

const YAML_CONFIG_FILENAME = 'config.yaml';

// Global storage provider instance
// This is initialized on first use and used by utility functions
// that cannot use dependency injection
let globalStorageProvider: IStorageProvider | null = null;
let globalDataPath: string = './data';

/**
 * Initialize the global storage provider
 * This should be called during application startup
 */
export function initializeGlobalStorage(): void {
  try {
    const configPath = resolve(process.cwd(), process.env.CONFIG_FILE_PATH || YAML_CONFIG_FILENAME);
    const config = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;
    
    const storageConfig = config.storage?.data;
    
    if (storageConfig) {
      // Set global data path for backward compatibility
      if (typeof storageConfig === 'string') {
        globalDataPath = storageConfig;
      } else if (storageConfig.type === 'filesystem') {
        globalDataPath = storageConfig.config.path;
      } else if (storageConfig.type === 's3') {
        globalDataPath = './data'; // For S3, we still need a local path for some operations
      }
      
      // Create storage provider
      globalStorageProvider = StorageProviderFactory.create(storageConfig);
    }
  } catch (error) {
    console.warn('Failed to initialize global storage provider:', error);
    // Fallback to default filesystem storage
    globalDataPath = process.env.DATA_PATH || './data';
  }
}

/**
 * Get the global storage provider
 */
export function getGlobalStorageProvider(): IStorageProvider {
  if (!globalStorageProvider) {
    initializeGlobalStorage();
  }
  if (!globalStorageProvider) {
    // Fallback to filesystem provider
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
