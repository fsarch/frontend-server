import { AppModule } from "./app.module.js";
import { FsArchAppBuilder } from "@fsarch/server";
import { initializeGlobalStorage } from "./storage/global-storage.js";

// Initialize global storage provider for backward compatibility with utility functions
initializeGlobalStorage();

async function bootstrap() {
    const app = await new FsArchAppBuilder(AppModule, {
        name: 'Frontend-Server',
        version: '1.0.0',
    })
      .enableAuth()
      .addSwagger({
        title: 'Frontend-Server',
        description: 'The Frontend-Server API description',
        version: '1.0',
      })
      .build();

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
