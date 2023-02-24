import http from 'node:http';
import * as Url from 'node:url'
import { UPLOAD_REGEX } from './constants/regexes.js';
import handleUpload from './utils/handleUpload.js';

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

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(url));
});

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
