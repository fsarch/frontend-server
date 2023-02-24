import type { MetaData } from '../types/MetaData.js';
import { DATA_PATH, MAX_VERSION_AGE, MAX_VERSION_COUNT } from '../constants/app-constants.js';
import { rm, unlink } from 'fs/promises';
import path from 'node:path';

export default async function cleanupOldVersions(projectId: string, metaData: MetaData) {
    const maxVersionsToRemove = Math.max(metaData.versionsArray.length - MAX_VERSION_COUNT, 0);
    if (maxVersionsToRemove === 0) {
        return;
    }

    const versionsToRemove = new Set<string>;

    for (let i = 0; i < maxVersionsToRemove; i += 1) {
        const versionDeletionTime = metaData.versions[metaData.versionsArray[i]]?.deletionTime;
        if (Date.now() - (versionDeletionTime ?? 0) > MAX_VERSION_AGE) {
            versionsToRemove.add(metaData.versionsArray[i]);
        }
    }

    if (!versionsToRemove.size) {
        return;
    }

    // Remove the version from the versionsArray
    metaData.versionsArray = metaData.versionsArray.filter(v => !versionsToRemove.has(v));

    const versionsToRemoveArray = Array.from(versionsToRemove);

    await Promise.all(versionsToRemoveArray.map(async (version) => {
        try {
            delete metaData.versions[version];

            try {
                const uploadFileDirectory = path.resolve(DATA_PATH, projectId, `${version}.tar`);
                await unlink(uploadFileDirectory);
            } catch (e: any) {
                console.error(e);

                if (e?.code !== 'ENOENT') {
                    throw e;
                }
            }

            try {
                const uploadDirectory = path.resolve(DATA_PATH, projectId, version);
                await rm(uploadDirectory, {
                    recursive: true,
                });
            } catch (e: any) {
                console.error(e);

                if (e?.code !== 'ENOENT') {
                    throw e;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }));

    const fileIndex: Record<string, string[]> = {};

    metaData.versionsArray.forEach((version) => {
        Object.keys(metaData.versions[version]?.files ?? {}).forEach((path) => {
            fileIndex[path] ||= [];
            fileIndex[path].push(version);
        });
    });

    metaData.files = fileIndex;
}
