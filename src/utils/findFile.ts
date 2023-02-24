import { getMetaData } from './updateMetaData.js';
import path from 'node:path';
import { DATA_PATH } from '../constants/app-constants.js';

export default async function findFile(projectId: string, requestPath: string) {
    const metaData = await getMetaData(projectId);
    const normalizedPath = requestPath.toLowerCase();

    const foundFileVersions = metaData.files[normalizedPath];
    if (!foundFileVersions?.length) {
        return null;
    }

    const foundFileVersion = foundFileVersions[foundFileVersions.length - 1];
    if (!foundFileVersion) {
        return null;
    }

    const file = metaData.versions[foundFileVersion]?.files?.[normalizedPath];
    if (!file) {
        return null;
    }

    return {
        file,
        version: foundFileVersion,
        path: path.resolve(DATA_PATH, projectId, foundFileVersion, file.path),
    };
}
