import { Injectable, forwardRef, Inject, Logger } from '@nestjs/common';
import path from 'node:path';
import { MAX_VERSION_AGE, MAX_VERSION_COUNT } from '../../constants/app-constants.js';
import * as tar from 'tar';
import { lookup as mimeLookup } from 'mime-types';
import { BadRequestException } from "@nestjs/common";
import { Request } from 'express';
import AdmZip from 'adm-zip';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';

import isWithin from '../isWithin.js';
import { createHash } from 'crypto';
import { MetadataService } from '../metadata/metadata.service.js';
import { ProjectsService } from '../../controller/admin/projects/projects.service.js';
import { StorageService } from '../../storage/storage.service.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private tempBaseDir: string;

  constructor(
    private readonly metadataService: MetadataService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly storageService: StorageService,
  ) {
    this.tempBaseDir = path.join(tmpdir(), 'frontend-server-uploads');
  }

  /**
   * Create a temporary directory for extraction
   */
  private async createTempDir(): Promise<string> {
    await mkdir(this.tempBaseDir, { recursive: true });
    const tempDir = path.join(this.tempBaseDir, randomUUID());
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await rm(tempDir, { recursive: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp dir ${tempDir}:`, error);
    }
  }

  async handleUpload(req: Request, projectId: string): Promise<void> {
    const versionId = randomUUID();

    this.logger.log(`Received upload request for project ${projectId}, assigned version ${versionId}`, {
      projectId,
      versionId,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });

    // Create temp directory for extraction
    const tempDir = await this.createTempDir();

    try {
      // Determine archive type from content-type header, falling back to .tar.
      // Note: gzip content-types (e.g. "application/gzip", "application/x-gzip")
      // contain the substring "zip", so gzip must be checked before zip.
      const contentType = (req.headers['content-type'] || '').toLowerCase();
      const isGzip = contentType.includes('gzip') || contentType.includes('gz');
      const isZip = !isGzip && contentType.includes('zip');
      // tar.x() auto-detects gzip-compressed tarballs, so .tar and .tar.gz
      // both go through extractTar() - only the temp filename differs.
      const archiveExt = isZip ? '.zip' : isGzip ? '.tar.gz' : '.tar';
      const archiveFile = path.join(tempDir, `${versionId}${archiveExt}`);

      // Save archive to temp directory
      this.logger.log(`Buffering request body for project ${projectId}, version ${versionId}`, {
        projectId,
        versionId,
      });
      const archiveBuffer = await this.streamToBuffer(req);
      await writeFile(archiveFile, archiveBuffer);
      
      // Extract to temp directory
      const versionPath = path.join(tempDir, versionId);
      await mkdir(versionPath, { recursive: true });
      
      let paths: { path: string; size: number; originalPath: string; }[] = [];

      this.logger.log(`Starting extraction of ${archiveExt} archive for project ${projectId}, version ${versionId}`, {
        projectId,
        versionId,
        isZip,
        archiveSize: archiveBuffer.length,
      });

      if (isZip) {
        await this.extractZip(archiveFile, versionPath, paths);
      } else {
        await this.extractTar(archiveFile, versionPath, paths);
      }

      this.logger.log(`Finished extraction for project ${projectId}, version ${versionId}: ${paths.length} file(s) found`, {
        projectId,
        versionId,
        fileCount: paths.length,
        paths: paths.map((p) => p.originalPath),
      });

      // Copy extracted files to storage provider, hashing each file's
      // content as it is read from the temp dir the first time - avoids
      // reading every file back from the storage provider afterwards.
      const storageBasePath = `${projectId}/${versionId}`;
      const hashes = await this.copyToStorage(versionPath, storageBasePath, paths);

      // Create metadata
      await this.metadataService.createVersion(projectId, versionId);

      const files: Record<string, { hash: string; size: number; mime: string; path: string; }> = {};
      for (let i = 0, z = paths.length; i < z; i += 1) {
        const hash = hashes.get(paths[i].originalPath);
        if (!hash) {
          throw new Error(`Missing hash for file ${paths[i].originalPath}`);
        }

        files[paths[i].path] = {
          hash,
          size: paths[i].size,
          mime: mimeLookup(paths[i].path) || 'application/octet-stream',
          path: paths[i].originalPath,
        };
      }

      // Add files to version
      for (const [filePath, fileInfo] of Object.entries(files)) {
        await this.metadataService.addFileToVersion(versionId, {
          path: filePath,
          originalPath: fileInfo.path,
          hash: fileInfo.hash,
          size: fileInfo.size,
          mime: fileInfo.mime,
        });
      }

      // Set current version
      await this.projectsService.setCurrentVersion(projectId, versionId);

      // Mark old versions for deletion
      await this.metadataService.markOldVersionsForDeletion(
        projectId,
        MAX_VERSION_COUNT,
        MAX_VERSION_AGE,
      );

      // Cleanup old version files from storage
      await this.cleanupOldVersionFiles(projectId, versionId);
      
    } finally {
      // Always cleanup temp directory, even if an error occurred
      await this.cleanupTempDir(tempDir);
    }
  }

  /**
   * Extract ZIP archive to temp directory
   */
  private async extractZip(
    zipPath: string,
    targetDir: string,
    paths: { path: string; size: number; originalPath: string; }[]
  ): Promise<void> {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const extractPath = path.join(targetDir, entry.entryName);
        
        // Ensure parent directory exists
        await mkdir(path.dirname(extractPath), { recursive: true });
        
        // Extract file content
        zip.extractEntryTo(entry.entryName, targetDir, false, true);
        
        // Normalize path (remove leading ./ and \ and convert to lowercase for lookup)
        const normalizedPath = entry.entryName
          .replace(/^\.\//, '')
          .replace(/\\/g, '/');
        
        paths.push({
          path: normalizedPath.toLowerCase(),
          originalPath: normalizedPath,
          size: entry.header.size,
        });
      }
    }
  }

  /**
   * Extract TAR archive to temp directory
   */
  private async extractTar(
    tarPath: string,
    targetDir: string,
    paths: { path: string; size: number; originalPath: string; }[]
  ): Promise<void> {
    await tar.x({
      file: tarPath,
      cwd: targetDir,
      filter: (filePath, stat) => {
        if (!isWithin(targetDir, filePath)) {
          return false;
        }

        if ((stat as any).type === 'File') {
          const normalizedPath = filePath.startsWith('./') ? filePath.substring(2) : filePath;
          
          paths.push({
            path: normalizedPath.toLowerCase(),
            originalPath: normalizedPath,
            size: stat.size,
          });
        }
        
        return true;
      },
    });
  }

  /**
   * Copy extracted files from temp directory to storage provider.
   * Hashes each file's content while it is read from the temp dir, so
   * callers don't have to read it back from the storage provider again
   * just to compute the hash.
   */
  private async copyToStorage(
    tempDir: string,
    storageBasePath: string,
    paths: { path: string; size: number; originalPath: string; }[]
  ): Promise<Map<string, string>> {
    const hashes = new Map<string, string>();

    for (const fileInfo of paths) {
      const tempFilePath = path.join(tempDir, fileInfo.originalPath);
      const storageFilePath = `${storageBasePath}/${fileInfo.originalPath}`;

      // Ensure parent directory exists in storage
      const parentDir = storageFilePath.substring(0, storageFilePath.lastIndexOf('/'));
      await this.storageService.mkdir(parentDir, { recursive: true });

      // Read from temp once, hash the content while we have it, then write to storage
      const content = await readFile(tempFilePath);
      hashes.set(fileInfo.originalPath, createHash('md5').update(content).digest('base64'));
      await this.storageService.writeFile(storageFilePath, content);
    }

    return hashes;
  }

  /**
   * Cleanup old version files from storage
   */
  private async cleanupOldVersionFiles(projectId: string, currentVersionKey: string): Promise<void> {
    const versions = await this.projectsService.getProjectVersions(projectId);
    const versionsToDelete = versions.filter(v => v.deletionTime !== null && v.id !== currentVersionKey);

    for (const version of versionsToDelete) {
      try {
        // Delete all files in the version directory from storage
        const storageFiles = await this.storageService.listFiles(`${projectId}/${version.id}`);
        for (const filePath of storageFiles) {
          await this.storageService.deleteFile(filePath);
        }
        
        // Delete archive files from storage
        await this.storageService.deleteFile(`${projectId}/${version.id}.tar`);
        await this.storageService.deleteFile(`${projectId}/${version.id}.zip`);
      } catch (e: any) {
        if (e?.code !== 'ENOENT' && e?.code !== 'NoSuchKey') {
          console.error(`Error deleting files for version ${version.id}:`, e);
        }
      }
      
      // Delete from database
      await this.metadataService.deleteVersion(version.id);
    }
  }

  /**
   * Helper method to convert a Request stream to Buffer
   */
  private async streamToBuffer(req: Request): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
