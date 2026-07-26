import { Injectable } from '@nestjs/common';
import { IStorageProvider } from './storage-provider.interface.js';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

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

  getBasePath(): string {
    return this.basePath;
  }
}
