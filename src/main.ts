import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";

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
}

bootstrap();
