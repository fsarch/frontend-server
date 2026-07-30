import { Injectable, forwardRef, Inject, Logger } from '@nestjs/common';
import path from 'node:path';
import { DATA_PATH, MAX_VERSION_AGE, MAX_VERSION_COUNT } from '../../constants/app-constants.js';
import { mkdir, readFile, writeFile, unlink, rm } from 'node:fs/promises';
import * as tar from 'tar';
import { lookup as mimeLookup } from 'mime-types';
import { BadRequestException } from "@nestjs/common";
import { Request } from 'express';
import AdmZip from 'adm-zip';
import { randomUUID } from 'node:crypto';

import isWithin from '../isWithin.js';
import { createHash } from 'crypto';
import { MetadataService } from '../metadata/metadata.service.js';
import { ProjectsService } from '../../controller/admin/projects/projects.service.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly metadataService: MetadataService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async handleUpload(req: Request, projectId: string): Promise<void> {
    const versionId = randomUUID();

    const basePath = path.resolve(DATA_PATH, projectId);
    const versionPath = path.resolve(basePath, versionId);
    await mkdir(versionPath, {
      recursive: true,
    });

    // Determine archive type from content-type header or fallback to .tar
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    const isZip = contentType.includes('zip');
    const isTar = contentType.includes('tar') || !isZip;
    const archiveExt = isZip ? '.zip' : '.tar';
    const archiveFile = path.resolve(basePath, `${versionId}${archiveExt}`);
    
    // Save the uploaded file
    await writeFile(archiveFile, req);

    let paths: { path: string; size: number; originalPath: string; }[] = [];

    try {
      if (isZip) {
        await this.extractZip(archiveFile, versionPath, paths);
      } else {
        await this.extractTar(archiveFile, versionPath, paths);
      }
    } catch (error: any) {
      this.logger.error(`Error extracting ${archiveExt} file:`, {
        error,
      });
      throw new BadRequestException('Failed to extract archive file');
    }

    const files: Record<string, { hash: string; size: number; mime: string; path: string; }> = {};
    for (let i = 0, z = paths.length; i < z; i += 1) {
      const content = await readFile(path.resolve(versionPath, `./${paths[i].originalPath}`));
      const hash = createHash('md5').update(content).digest('base64');
      files[paths[i].path] = {
        hash,
        size: paths[i].size,
        mime: mimeLookup(paths[i].path) || 'application/octet-stream',
        path: paths[i].originalPath,
      };
    }

    // Erstelle die neue Version in der Datenbank
    await this.metadataService.createVersion(projectId, versionId);

    // Füge Dateien zur Version hinzu
    for (const [filePath, fileInfo] of Object.entries(files)) {
      await this.metadataService.addFileToVersion(versionId, {
        path: filePath,
        originalPath: fileInfo.path,
        hash: fileInfo.hash,
        size: fileInfo.size,
        mime: fileInfo.mime,
      });
    }

    // Setze die aktuelle Version
    await this.projectsService.setCurrentVersion(projectId, versionId);

    // Bereinge alte Versionen
    await this.metadataService.markOldVersionsForDeletion(
      projectId,
      MAX_VERSION_COUNT,
      MAX_VERSION_AGE,
    );

    // Lösche alte Versionen Dateien vom Dateisystem
    await this.cleanupOldVersionFiles(projectId, versionId);
  }

  private async extractZip(zipPath: string, targetDir: string, paths: { path: string; size: number; originalPath: string; }[]): Promise<void> {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      // Only process files, skip directories
      if (!entry.isDirectory) {
        const extractPath = path.resolve(targetDir, entry.entryName);
        
        // Ensure parent directory exists
        await mkdir(path.dirname(extractPath), { recursive: true });
        
        // Extract file content
        zip.extractEntryTo(targetDir, entry.entryName, false, true);
        
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

  private async extractTar(tarPath: string, targetDir: string, paths: { path: string; size: number; originalPath: string; }[]): Promise<void> {
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

  private async cleanupOldVersionFiles(projectId: string, currentVersionKey: string): Promise<void> {
    // Hole alle Versionen
    const versions = await this.projectsService.getProjectVersions(projectId);

    // Finde Versionen, die in der Datenbank als gelöscht markiert sind
    const versionsToDelete = versions.filter(v => v.deletionTime !== null && v.id !== currentVersionKey);

    for (const version of versionsToDelete) {
      try {
        // Lösche .tar Datei
        const tarFile = path.resolve(DATA_PATH, projectId, `${version.id}.tar`);
        await unlink(tarFile);
      } catch (e: any) {
        if (e?.code !== 'ENOENT') {
          console.error(`Error deleting tar file for version ${version.id}:`, e);
        }
      }

      try {
        // Lösche .zip Datei
        const zipFile = path.resolve(DATA_PATH, projectId, `${version.id}.zip`);
        await unlink(zipFile);
      } catch (e: any) {
        if (e?.code !== 'ENOENT') {
          console.error(`Error deleting zip file for version ${version.id}:`, e);
        }
      }

      try {
        // Lösche Verzeichnis
        const versionDir = path.resolve(DATA_PATH, projectId, version.id);
        await rm(versionDir, { recursive: true });
      } catch (e: any) {
        if (e?.code !== 'ENOENT') {
          console.error(`Error deleting directory for version ${version.id}:`, e);
        }
      }

      // Lösche aus der Datenbank
      await this.metadataService.deleteVersion(version.id);
    }
  }
}
