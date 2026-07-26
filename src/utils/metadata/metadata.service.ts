import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProjectFile } from '../../database/entities/project-file.entity.js';
import { ProjectVersion } from '../../database/entities/project-version.entity.js';

// Type für die Rückkehrwerte, kompatibel mit dem alten MetaData Typ
export type ProjectFileInfo = {
  hash: string;
  size: number;
  path: string;
  mime: string;
};

export type ProjectVersionInfo = {
  creationTime: number;
  deletionTime: number | null;
  files: Record<string, ProjectFileInfo>;
};

export type ProjectMetaData = {
  currentVersion: string | null;
  versions: Record<string, ProjectVersionInfo>;
  versionsArray: string[];
  files: Record<string, string[]>;
};

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(ProjectVersion)
    private readonly projectVersionRepository: Repository<ProjectVersion>,
    @InjectRepository(ProjectFile)
    private readonly projectFileRepository: Repository<ProjectFile>,
  ) {}

  /**
   * Ruft die Metadaten eines Projekts aus der Datenbank ab
   */
  async getMetaData(projectId: string): Promise<ProjectMetaData> {
    const versions = await this.projectVersionRepository.find({
      where: { projectId, deletionTime: null },
      order: { creationTime: 'DESC' },
    });

    if (!versions.length) {
      return {
        currentVersion: null,
        versions: {},
        versionsArray: [],
        files: {},
      };
    }

    const versionIds = versions.map(v => v.id);
    const files = await this.projectFileRepository.find({
      where: { versionId: In(versionIds), deletionTime: null },
      order: { creationTime: 'DESC' },
    });

    // Baue die Struktur auf
    const versionsMap: Record<string, ProjectVersionInfo> = {};
    const versionsArray: string[] = [];
    const filesMap: Record<string, string[]> = {};

    for (const version of versions) {
      const versionKey = version.id;
      versionsArray.push(versionKey);

      const versionFiles = files.filter(f => f.versionId === version.id);
      const filesRecord: Record<string, ProjectFileInfo> = {};

      for (const file of versionFiles) {
        filesRecord[file.path] = {
          hash: file.hash,
          size: file.size,
          path: file.originalPath,
          mime: file.mime,
        };

        // Füge Datei zum Index hinzu
        if (!filesMap[file.path]) {
          filesMap[file.path] = [];
        }
        filesMap[file.path].push(versionKey);
      }

      versionsMap[versionKey] = {
        creationTime: version.creationTime.getTime(),
        deletionTime: null,
        files: filesRecord,
      };
    }

    return {
      currentVersion: versions[0]?.id ?? null,
      versions: versionsMap,
      versionsArray,
      files: filesMap,
    };
  }

  /**
   * Aktualisiert die Metadaten eines Projekts
   */
  async updateMetaData(
    projectId: string,
    callback: (metaData: ProjectMetaData) => Promise<ProjectMetaData>,
  ): Promise<ProjectMetaData> {
    const metaData = await this.getMetaData(projectId);
    const result = await callback(metaData);

    // Speichere Änderungen in der Datenbank
    await this.saveMetaData(projectId, result);

    return result;
  }

  /**
   * Speichert Metadaten in der Datenbank
   */
  private async saveMetaData(
    projectId: string,
    metaData: ProjectMetaData,
  ): Promise<void> {
    // Aktualisiere die aktuelle Version im Projekt
    if (metaData.currentVersion) {
      // Hier müsste der ProjectService aufgerufen werden, um currentVersionId zu setzen
      // Da wir keine zirkuläre Abhängigkeit wollen, wird das im handleUpload Service erledigt
    }

    // Speichere Versionen und Dateien
    for (const versionKey of metaData.versionsArray) {
      const versionInfo = metaData.versions[versionKey];

      // Finde oder erstelle die Version
      let version = await this.projectVersionRepository.findOne({
        where: { id: versionKey },
      });

      if (!version) {
        version = this.projectVersionRepository.create({
          id: versionKey,
          projectId,
          creationTime: new Date(versionInfo.creationTime),
        });
      }

      await this.projectVersionRepository.save(version);

      // Speichere Dateien für diese Version
      for (const [filePath, fileInfo] of Object.entries(versionInfo.files)) {
        let file = await this.projectFileRepository.findOne({
          where: { versionId: version.id, path: filePath },
        });

        if (!file) {
          file = this.projectFileRepository.create({
            versionId: version.id,
            path: filePath,
            originalPath: fileInfo.path,
            hash: fileInfo.hash,
            size: fileInfo.size,
            mime: fileInfo.mime,
          });
        } else {
          file.hash = fileInfo.hash;
          file.size = fileInfo.size;
          file.mime = fileInfo.mime;
          file.originalPath = fileInfo.path;
        }

        await this.projectFileRepository.save(file);
      }
    }
  }

  /**
   * Invalidiert den Cache für ein Projekt
   */
  async invalidateMetaData(projectId: string): Promise<boolean> {
    // Da wir direkt aus der Datenbank lesen, ist kein Cache-Invaliding nötig
    // Aber für Rückwärtskompatibilität geben wir true zurück
    return true;
  }

  /**
   * Findet eine Datei in einem Projekt
   */
  async findFile(projectId: string, requestPath: string): Promise<{
    file: ProjectFileInfo;
    version: string;
    filePath: string;
  } | null> {
    const normalizedPath = requestPath.toLowerCase();

    // Finde die neueste Version des Projekts
    const versions = await this.projectVersionRepository.find({
      where: { projectId, deletionTime: null },
      order: { creationTime: 'DESC' },
    });

    if (!versions.length) {
      return null;
    }

    // Suche Datei in allen Versionen (beginnend mit der neuesten)
    for (const version of versions) {
      const file = await this.projectFileRepository.findOne({
        where: { versionId: version.id, path: normalizedPath, deletionTime: null },
      });

      if (file) {
        return {
          file: {
            hash: file.hash,
            size: file.size,
            path: file.originalPath,
            mime: file.mime,
          },
          version: version.id,
          filePath: file.originalPath,
        };
      }
    }

    return null;
  }

  /**
   * Erstellt eine neue Version für ein Projekt
   */
  async createVersion(projectId: string, versionKey: string): Promise<ProjectVersion> {
    const version = this.projectVersionRepository.create({
      id: versionKey,
      projectId,
    });

    return await this.projectVersionRepository.save(version);
  }

  /**
   * Fügt eine Datei zu einer Version hinzu
   */
  async addFileToVersion(
    versionId: string,
    fileInfo: {
      path: string;
      originalPath: string;
      hash: string;
      size: number;
      mime: string;
    },
  ): Promise<ProjectFile> {
    const file = this.projectFileRepository.create({
      versionId,
      path: fileInfo.path,
      originalPath: fileInfo.originalPath,
      hash: fileInfo.hash,
      size: fileInfo.size,
      mime: fileInfo.mime,
    });

    return await this.projectFileRepository.save(file);
  }

  /**
   * Setzt die Markierung für alte Versionen (Soft-Delete)
   */
  async markOldVersionsForDeletion(
    projectId: string,
    maxVersionCount: number,
    maxVersionAge: number,
  ): Promise<void> {
    const versions = await this.projectVersionRepository.find({
      where: { projectId, deletionTime: null },
      order: { creationTime: 'ASC' },
    });

    if (versions.length <= maxVersionCount) {
      return;
    }

    const versionsToMark = versions.slice(0, versions.length - maxVersionCount);

    for (const version of versionsToMark) {
      const now = Date.now();
      const versionAge = now - version.creationTime.getTime();

      if (versionAge > maxVersionAge) {
        version.deletionTime = new Date();
        await this.projectVersionRepository.save(version);
      }
    }
  }

  /**
   * Löscht eine Version physisch
   */
  async deleteVersion(versionId: string): Promise<void> {
    await this.projectFileRepository.delete({ versionId });
    await this.projectVersionRepository.delete({ id: versionId });
  }
}
