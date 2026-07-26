import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider } from './storage-provider.interface.js';
import { DATA_STORAGE_PROVIDER } from './storage.module.js';
import { FileSystemStorageProvider } from './filesystem-storage.provider.js';

@Injectable()
export class StorageService {
  constructor(
    @Inject(DATA_STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  getStorageProvider(): IStorageProvider {
    return this.storageProvider;
  }

  // Helper methods for convenience
  async readFile(path: string): Promise<Buffer> {
    return this.storageProvider.readFile(path);
  }

  async writeFile(path: string, data: Buffer): Promise<void> {
    return this.storageProvider.writeFile(path, data);
  }

  async exists(path: string): Promise<boolean> {
    return this.storageProvider.exists(path);
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    return this.storageProvider.mkdir(path, options);
  }

  async deleteFile(path: string): Promise<void> {
    return this.storageProvider.deleteFile(path);
  }

  // Check if the underlying provider is FileSystemStorageProvider
  isFileSystem(): boolean {
    return this.storageProvider instanceof FileSystemStorageProvider;
  }

  // Get base path if using filesystem storage
  getBasePath(): string | null {
    if (this.storageProvider instanceof FileSystemStorageProvider) {
      return this.storageProvider.getBasePath();
    }
    return null;
  }
}
