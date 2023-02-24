import http from 'node:http';
import * as Url from 'node:url'
import { PROJECT_REGEX, UPLOAD_REGEX } from './constants/regexes.js';
import handleUpload from './utils/handleUpload.js';
import handleFile from './utils/handleFile.js';

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

        await handleUpload(req, res, projectId);
        return;
    }

    if (url.pathname?.startsWith('/projects')) {
        const projectMatch = url.pathname?.match(PROJECT_REGEX);
        if (!projectMatch) {
            res.statusCode = 404;
            res.end();
            return;
        }

        if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end();
            return;
        }

        const projectId = projectMatch[1];
        const resourcePath = projectMatch[2] ?? '';

        await handleFile(req, res, projectId, resourcePath);
        return;
    }

    res.statusCode = 404;
    res.end();
});

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
