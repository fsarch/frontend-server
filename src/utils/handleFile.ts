import type { Response } from 'express';
import * as fs from 'fs';
import LRUCache from 'lru-cache';
import { readFile } from 'node:fs/promises';
import { lookup as mimeLookup } from 'mime-types';

import findFile from './findFile.js';

const CACHE = new LRUCache<string, Buffer>({
  maxSize: 100 * 1024 * 1024,
  sizeCalculation: (value, key) => {
    return value.length;
  },
})

export default async function handleFile(
  headers: Headers,
  res: Response,
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

  const eTagValue = JSON.stringify(foundFile.file.hash);
  if (headers['if-none-match'] && headers['if-none-match'] === eTagValue) {
    res.statusCode = 304;
    res.end();
    return;
  }

  const mimeType = mimeLookup(foundFile.file.path);
  if (mimeType === 'text/html') {
    res.setHeader('Cache-Control', `public, max-age=0, must-revalidate, stale-if-error=${60 * 60}`);
  } else if (mimeType === 'text/css') {
    res.setHeader('Cache-Control', `public, max-age=${24 * 60 * 60}, must-revalidate, stale-if-error=${60 * 60}`);
  } else if (mimeType === 'text/javascript') {
    res.setHeader('Cache-Control', `public, max-age=${24 * 60 * 60}, must-revalidate, stale-if-error=${60 * 60}`);
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  res.setHeader('Content-Type', foundFile.file.mime);
  res.setHeader('ETag', eTagValue);

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
