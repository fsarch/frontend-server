import { Injectable, forwardRef, Inject } from '@nestjs/common';
import path from 'node:path';
import { DATA_PATH, MAX_VERSION_AGE, MAX_VERSION_COUNT } from '../../constants/app-constants.js';
import { mkdir, readFile, writeFile, unlink, rm } from 'node:fs/promises';
import * as tar from 'tar';
import { lookup as mimeLookup } from 'mime-types';
import { BadRequestException } from "@nestjs/common";
import { Request } from 'express';

import isWithin from '../isWithin.js';
import { createHash } from 'crypto';
import { MetadataService } from '../metadata/metadata.service.js';
import { ProjectsService } from '../../controller/admin/projects/projects.service.js';

@Injectable()
export class UploadService {
  constructor(
    private readonly metadataService: MetadataService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async handleUpload(req: Request, projectId: string): Promise<void> {
    const now = new Date();
    const monthString = String(now.getUTCMonth()).padStart(2, '0');
    const dateString = String(now.getUTCDate()).padStart(2, '0');
    const hoursString = String(now.getUTCHours()).padStart(2, '0');
    const minutesString = String(now.getUTCMinutes()).padStart(2, '0');
    const secondsString = String(now.getUTCSeconds()).padStart(2, '0');

    const versionKey = `${now.getUTCFullYear()}-${monthString}-${dateString}_${hoursString}:${minutesString}:${secondsString}.${now.getUTCMilliseconds()}`;

    const basePath = path.resolve(DATA_PATH, projectId);
    const versionPath = path.resolve(basePath, versionKey);
    await mkdir(versionPath, {
      recursive: true,
    });

    const tarFile = path.resolve(basePath, `${versionKey}.tar`);
    await writeFile(tarFile, req);

    let paths: { path: string; size: number; originalPath: string; }[] = [];

    try {
      await tar.x({
        file: tarFile,
        cwd: versionPath,
        filter: (path, stat) => {
          if (!isWithin(versionPath, path)) {
            return false;
          }

          if ((stat as any).type === 'File') {
            const normalizedPath = path.startsWith('./') ? path.substring(2) : path;

            paths.push({
              path: normalizedPath.toLowerCase(),
              originalPath: normalizedPath,
              size: stat.size,
            });
          }

          return true;
        },
      });
    } catch (e: any) {
      throw new BadRequestException();
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
    await this.metadataService.createVersion(projectId, versionKey);

    // Füge Dateien zur Version hinzu
    for (const [filePath, fileInfo] of Object.entries(files)) {
      await this.metadataService.addFileToVersion(versionKey, {
        path: filePath,
        originalPath: fileInfo.path,
        hash: fileInfo.hash,
        size: fileInfo.size,
        mime: fileInfo.mime,
      });
    }

    // Setze die aktuelle Version
    await this.projectsService.setCurrentVersion(projectId, versionKey);

    // Bereinge alte Versionen
    await this.metadataService.markOldVersionsForDeletion(
      projectId,
      MAX_VERSION_COUNT,
      MAX_VERSION_AGE,
    );

    // Lösche alte Versionen Dateien vom Dateisystem
    await this.cleanupOldVersionFiles(projectId, versionKey);
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
