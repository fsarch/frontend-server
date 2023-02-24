import http from 'node:http';
import * as Url from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import tar from 'tar';
import isWithin from './utils/isWithin.js';
import { UPLOAD_REGEX } from './constants/regexes.js';
import { DATA_PATH } from './constants/app-constants.js';
import updateMetaData from './utils/updateMetaData.js';
import { createHash } from 'crypto';

const port = 3000;

const server = http.createServer(async (req, res) => {
    const url = Url.parse(req.url as string);

    if (url.pathname?.startsWith('/api')) {
        const uploadMatch = url.pathname?.match(UPLOAD_REGEX);
        if (!uploadMatch) {
            res.statusCode = 404;
            res.end();
            return;
        }

        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
        }

        const projectId = uploadMatch[1];

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

        let paths: string[] = [];

        await tar.x({
            file: tarFile,
            cwd: versionPath,
            filter: (path, stat) => {
                if (!isWithin(versionPath, path)) {
                    return false;
                }

                if ((stat as any).type === 'File') {
                    paths.push(path.startsWith('./') ? path.substring(2) : path);
                }

                return true;
            },
        });

        console.log('projectId', projectId, versionKey, paths);

        const files: Record<string, { hash: string }> = {};
        for (let i = 0, z = paths.length; i < z ; i += 1) {
            const content = await readFile(path.resolve(versionPath, `./${paths[i]}`));
            const hash = createHash('md5').update(content).digest('base64');
            files[paths[i]] = {
                hash
            };
        }

        await updateMetaData(projectId, async (metaData) => {
            metaData.versions[versionKey] = {
                files,
            };

            paths.forEach((path) => {
                metaData.files[path] ||= [];
                metaData.files[path].push(versionKey);
            });

            metaData.currentVersion = versionKey;
            metaData.versionsArray.push(versionKey);

            return metaData;
        });

        res.statusCode = 201;
        res.end();
        return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(url));
});

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
