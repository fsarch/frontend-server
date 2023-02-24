import type { MetaData } from '../types/MetaData.js';
import { Lock } from 'semaphore-async-await';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_PATH } from '../constants/app-constants.js';

const cache: Record<string, { data: MetaData | null, semaphore: Lock }> = {};

export default async function updateMetaData(projectId: string, cb: (value: MetaData) => Promise<MetaData>) {
    if (!cache[projectId]) {
        cache[projectId] = {
            semaphore: new Lock(),
            data: null,
        };
    }

    const metaFilePath = path.resolve(DATA_PATH, projectId, 'meta.json');

    await cache[projectId].semaphore.execute(async () => {
        if (!cache[projectId].data) {
            try {
                const fileContent = await readFile(metaFilePath, 'utf-8');
                cache[projectId].data = JSON.parse(fileContent);
            } catch (e: any) {
                if (e?.code !== 'ENOENT') {
                    throw e;
                }

                cache[projectId].data = {
                    currentVersion: null,
                    files: {},
                    versions: {},
                    versionsArray: [],
                }
            }
        }

        const result = await cb(cache[projectId].data as MetaData);
        cache[projectId].data = result;
        await writeFile(metaFilePath, JSON.stringify(cache[projectId].data));
    });
}

export async function getMetaData(projectId: string): Promise<MetaData> {
    if (!cache[projectId]) {
        cache[projectId] = {
            semaphore: new Lock(),
            data: null,
        };
    }

    const metaFilePath = path.resolve(DATA_PATH, projectId, 'meta.json');

    if (!cache[projectId].data) {
        await cache[projectId].semaphore.execute(async () => {
            if (cache[projectId].data) {
                return;
            }

            try {
                const fileContent = await readFile(metaFilePath, 'utf-8');
                cache[projectId].data = JSON.parse(fileContent);
            } catch (e: any) {
                if (e?.code !== 'ENOENT') {
                    throw e;
                }

                cache[projectId].data = {
                    currentVersion: null,
                    files: {},
                    versions: {},
                    versionsArray: [],
                }
            }
        });
    }

    return cache[projectId].data as MetaData;
}
