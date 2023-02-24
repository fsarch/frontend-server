import type { IncomingMessage, ServerResponse } from 'node:http';
import findFile from './findFile.js';
import { DATA_PATH } from '../constants/app-constants.js';
import * as fs from 'fs';
import LRUCache from 'lru-cache';
import { readFile } from 'node:fs/promises';

const CACHE = new LRUCache<string, Buffer>({
    maxSize: 100 * 1024 * 1024,
    sizeCalculation: (value, key) => {
        return value.length;
    },
})

export default async function handleFile(
    req: IncomingMessage,
    res: ServerResponse & { req: IncomingMessage; },
    projectId: string,
    requestPath: string,
): Promise<void> {
    let foundFile = await findFile(projectId, requestPath);

    if (!foundFile) {
        foundFile = await findFile(projectId, 'index.html');
    }

    if (!foundFile || foundFile.path.endsWith('.js.map')) {
        res.statusCode = 404;
        res.end();
        return;
    }

    res.setHeader('Content-Type', foundFile.file.mime);

    if (foundFile.file.size > 5 * 1024 * 1024) { // stream file when size is bigger than 5 MB

        const contentStream = fs.createReadStream(foundFile.path);

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
        console.log('serve from cache');
        res.statusCode = 200;
        res.end(cachedEntry);
        return;
    }

    const content = await readFile(foundFile.path);
    CACHE.set(foundFile.path, content);

    res.statusCode = 200;
    res.end(content);
    return;
}
