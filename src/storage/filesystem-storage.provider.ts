import { Injectable } from '@nestjs/common';
import { IStorageProvider } from './storage-provider.interface.js';
import * as fs from 'node:fs/promises';
import { existsSync, readdir } from 'node:fs';
import { createReadStream as fsCreateReadStream } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'stream';

@Injectable()
export class FileSystemStorageProvider implements IStorageProvider {
  constructor(private readonly basePath: string) {}

  private getFullPath(filePath: string): string {
    return path.resolve(this.basePath, filePath);
  }

  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(this.getFullPath(filePath));
  }

  async writeFile(filePath: string, data: Buffer): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async exists(filePath: string): Promise<boolean> {
    return existsSync(this.getFullPath(filePath));
  }

  async mkdir(filePath: string, options?: { recursive?: boolean }): Promise<void> {
    await fs.mkdir(this.getFullPath(filePath), options);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(this.getFullPath(filePath));
  }

  async createReadStream(filePath: string): Promise<Readable> {
    const fullPath = this.getFullPath(filePath);
    return fsCreateReadStream(fullPath);
  }

  async listFiles(prefix: string): Promise<string[]> {
    const fullPrefix = this.getFullPath(prefix);
    
    try {
      const items = await fs.readdir(fullPrefix, { withFileTypes: true });
      const files: string[] = [];
      
      for (const item of items) {
        const itemPath = path.join(prefix, item.name);
        if (item.isFile()) {
          files.push(itemPath);
        } else if (item.isDirectory()) {
          // Recursively list files in subdirectories
          const subFiles = await this.listFiles(itemPath);
          files.push(...subFiles);
        }
      }
      
      return files;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  getBasePath(): string {
    return this.basePath;
  }
}
