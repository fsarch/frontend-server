import http from 'node:http';
import * as Url from 'node:url';

import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";

import { PROJECT_REGEX } from './constants/regexes.js';
import handleFile from './utils/handleFile.js';
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const PORT = parseInt(process.env.PORT as string, 10) || 8080;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: true,
        rawBody: true,
    });

    app.enableCors();

    app.enableVersioning({
        type: VersioningType.URI,
    });

    const config = new DocumentBuilder()
      .setTitle('Frontend-Server')
      .setDescription('The Frontend-Server description')
      .addBearerAuth()
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);

    await app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });

    const server = http.createServer(async (req, res) => {
        const url = Url.parse(req.url as string);

        // if (url.pathname?.startsWith('/api')) {
        //     const uploadMatch = url.pathname?.match(UPLOAD_REGEX);
        //     if (!uploadMatch) {
        //         res.statusCode = 404;
        //         res.end();
        //         return;
        //     }
        //
        //     if (req.method !== 'POST') {
        //         res.statusCode = 405;
        //         res.end();
        //         return;
        //     }
        //
        //     if (!req.headers.authorization || !req.headers.authorization.toLowerCase().startsWith('secret ')) {
        //         res.statusCode = 401;
        //         res.end();
        //         return;
        //     }
        //
        //     const secret = req.headers.authorization.substring(7);
        //
        //     if (secret !== UPLOAD_SECRET) {
        //         res.statusCode = 403;
        //         res.end();
        //         return;
        //     }
        //
        //     const projectId = uploadMatch[1];
        //
        //     await handleUpload(req, projectId);
        //
        //     try {
        //         await invalidateMetaData(projectId);
        //     } catch (e) {
        //         console.error('error while invalidating meta data', e);
        //     }
        //     return;
        // }

        // if (url.pathname?.startsWith('/projects')) {
        //     const projectMatch = url.pathname?.match(PROJECT_REGEX);
        //     if (!projectMatch) {
        //         res.statusCode = 404;
        //         res.end();
        //         return;
        //     }
        //
        //     if (req.method !== 'GET') {
        //         res.statusCode = 405;
        //         res.end();
        //         return;
        //     }
        //
        //     const projectId = projectMatch[1];
        //     const resourcePath = projectMatch[2] ?? '';
        //
        //     await handleFile(req, res, projectId, resourcePath);
        //     return;
        // }
        //
        // res.statusCode = 404;
        // res.end();
    });

    // server.listen(PORT, () => {
    //     console.log(`Server running at port ${PORT}`);
    // });
}

bootstrap();
