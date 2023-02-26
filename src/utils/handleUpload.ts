import path from 'node:path';
import { DATA_PATH, MAX_VERSION_AGE, MAX_VERSION_COUNT } from '../constants/app-constants.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import tar from 'tar';
import isWithin from './isWithin.js';
import { createHash } from 'crypto';
import updateMetaData from './updateMetaData.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookup as mimeLookup } from 'mime-types';
import cleanupOldVersions from './cleanupOldVersions.js';

export default async function handleUpload(req: IncomingMessage, res: ServerResponse & { req: IncomingMessage; }, projectId: string): Promise<void> {
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
        res.statusCode = 400;
        res.end();
        return;
    }

    const files: Record<string, { hash: string; size: number; mime: string; path: string; }> = {};
    for (let i = 0, z = paths.length; i < z ; i += 1) {
        const content = await readFile(path.resolve(versionPath, `./${paths[i].originalPath}`));
        const hash = createHash('md5').update(content).digest('base64');
        files[paths[i].path] = {
            hash,
            size: paths[i].size,
            mime: mimeLookup(paths[i].path) || 'application/octet-stream',
            path: paths[i].originalPath,
        };
    }

    await updateMetaData(projectId, async (metaData) => {
        if (metaData.currentVersion && metaData.versions[metaData.currentVersion]) {
            metaData.versions[metaData.currentVersion].deletionTime = Date.now();
        }

        metaData.versions[versionKey] = {
            creationTime: Date.now(),
            deletionTime: null,
            files,
        };

        paths.forEach((path) => {
            metaData.files[path.path] ||= [];
            metaData.files[path.path].push(versionKey);
        });

        metaData.currentVersion = versionKey;
        metaData.versionsArray.push(versionKey);

        if (metaData.versionsArray.length > MAX_VERSION_COUNT && (Date.now() - (metaData.versions[metaData.versionsArray[0]]?.deletionTime ?? 0) > MAX_VERSION_AGE)) {
            await cleanupOldVersions(projectId, metaData);
        }

        return metaData;
    });

    res.statusCode = 201;
    res.end();
    return;
}
