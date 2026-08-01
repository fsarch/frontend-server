import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import LRUCache from 'lru-cache';
import { lookup as mimeLookup } from 'mime-types';
import path from 'node:path';
import { MetadataService, ProjectFileInfo } from '../metadata/metadata.service.js';
import { ProjectFile } from '../../database/entities/project-file.entity.js';
import { StorageService } from '../../storage/storage.service.js';
import { Readable } from 'stream';

const CACHE = new LRUCache<string, Buffer>({
  maxSize: 100 * 1024 * 1024,
  sizeCalculation: (value, key) => {
    return value.length;
  },
});

export type Headers = Record<string, string>;

@Injectable()
export class FileService {
  constructor(
    private readonly metadataService: MetadataService,
    @InjectRepository(ProjectFile)
    private readonly projectFileRepository: Repository<ProjectFile>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Findet eine Datei in einem Projekt
   */
  async findFile(
    projectId: string,
    requestPath: string,
  ): Promise<{
    file: ProjectFileInfo;
    version: string;
    path: string;
  } | null> {
    const result = await this.metadataService.findFile(projectId, requestPath);

    if (!result) {
      return null;
    }

    // Use relative path for storage provider
    return {
      file: result.file,
      version: result.version,
      path: `${projectId}/${result.version}/${result.file.path}`,
    };
  }

  /**
   * Behandelt eine Dateianfrage (ersetzt handleFile.ts)
   */
  async handleFile(
    headers: Headers,
    res: Response,
    projectId: string,
    requestPath: string,
  ): Promise<void> {
    let foundFile = await this.findFile(projectId, requestPath);

    if (!foundFile) {
      foundFile = await this.findFile(projectId, 'index.html');
    }

    if (!foundFile || foundFile.file.path.endsWith('.js.map')) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const eTagValue = JSON.stringify(foundFile.file.hash);
    if (headers['if-none-match'] && headers['if-none-match'] === eTagValue) {
      res.statusCode = 304;
      res.end();
      return;
    }

    const mimeType = mimeLookup(foundFile.file.path);
    if (mimeType === 'text/html') {
      res.setHeader('Cache-Control', `public, max-age=0, must-revalidate, stale-if-error=${60 * 60}`);
    } else if (mimeType === 'text/css') {
      res.setHeader('Cache-Control', `public, max-age=${5 * 60}, must-revalidate, stale-if-error=${60 * 60}`);
    } else if (mimeType === 'text/javascript') {
      res.setHeader('Cache-Control', `public, max-age=${5 * 60}, must-revalidate, stale-if-error=${60 * 60}`);
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }

    res.setHeader('Content-Type', foundFile.file.mime);
    res.setHeader('ETag', eTagValue);

    if (foundFile.file.size > 5 * 1024 * 1024) {
      // Stream file when size is bigger than 5 MB
      const contentStream = await this.storageService.createReadStream(foundFile.path);

      contentStream.on('end', () => {
        res.statusCode = 200;
        res.end();
      });

      contentStream.on('error', (err) => {
        console.error(err);
        res.statusCode = 500;
        res.end();
      });

      contentStream.pipe(res);
      return;
    }

    const cachedEntry = CACHE.get(foundFile.path);
    if (cachedEntry) {
      res.statusCode = 200;
      res.end(cachedEntry);
      return;
    }

    try {
      const content = await this.storageService.readFile(foundFile.path);
      CACHE.set(foundFile.path, content);

      res.statusCode = 200;
      res.end(content);
      return;
    } catch (err) {
      console.error(`Error reading file ${foundFile.path}:`, err);
      res.statusCode = 404;
      res.end();
      return;
    }
  }
}
