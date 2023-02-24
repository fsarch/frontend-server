import path from 'node:path';
import { DATA_PATH } from '../constants/app-constants.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import tar from 'tar';
import isWithin from './isWithin.js';
import { createHash } from 'crypto';
import updateMetaData from './updateMetaData.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookup as mimeLookup } from 'mime-types';

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

    const files: Record<string, { hash: string; size: number; mime: string; path: string; }> = {};
    for (let i = 0, z = paths.length; i < z ; i += 1) {
        const content = await readFile(path.resolve(versionPath, `./${paths[i].path}`));
        const hash = createHash('md5').update(content).digest('base64');
        files[paths[i].path] = {
            hash,
            size: paths[i].size,
            mime: mimeLookup(paths[i].path) || 'application/octet-stream',
            path: paths[i].originalPath,
        };
    }

    await updateMetaData(projectId, async (metaData) => {
        metaData.versions[versionKey] = {
            files,
        };

        paths.forEach((path) => {
            metaData.files[path.path] ||= [];
            metaData.files[path.path].push(versionKey);
        });

        metaData.currentVersion = versionKey;
        metaData.versionsArray.push(versionKey);

        return metaData;
    });

    res.statusCode = 201;
    res.end();
    return;
}
