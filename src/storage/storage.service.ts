import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider } from './storage-provider.interface.js';
import { Readable } from 'stream';
import { DATA_STORAGE_PROVIDER } from "./storage.const.js";

@Injectable()
export class StorageService {
  constructor(
    @Inject(DATA_STORAGE_PROVIDER)
    private storageProvider: IStorageProvider,
  ) {}

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

  async createReadStream(path: string): Promise<Readable> {
    const content = await this.readFile(path);
    return Readable.from(content);
  }

  /**
   * List files with a given prefix (for cleanup operations)
   * Note: Implementation depends on the storage provider
   */
  async listFiles(prefix: string): Promise<string[]> {
    // Default implementation - providers can override if they support listing
    // For now, return empty array
    return [];
  }
}
